const Comment = require("../models/CommentModel");
const NotificationService = require("../services/NotificationService");
const User = require("../models/UserModel");

const createComment = async (req, res) => {
  try {
    const { lessonId, user, content, images, parentCommentId } = req.body;

    if (!lessonId || !user || !content) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }

    const newComment = new Comment({
      lessonId,
      user,
      content,
      images: images || [],
      parentCommentId: parentCommentId || null
    });

    await newComment.save();

    const senderId = user._id || user.userId || user.id;

    const Course = require("../models/CourseModel");
    let courseSlugStr = req.query.courseSlug || req.body.courseSlug || "";
    let lessonSlugStr = lessonId;

    try {
      const course = await Course.findOne({
        $or: [
          { "sections.lessons._id": lessonId },
          { "sections.lessons.slug": lessonId },
          ...(courseSlugStr ? [{ slug: courseSlugStr }] : [])
        ]
      });
      if (course) {
        if (!courseSlugStr || courseSlugStr === "") {
          courseSlugStr = course.slug;
        }
        for (const sec of course.sections || []) {
          const les = (sec.lessons || []).find(l => l._id && l._id.toString() === lessonId.toString() || l.slug === lessonId);
          if (les && les.slug) {
            lessonSlugStr = les.slug;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Lookup course/lesson error:", e);
    }

    const targetUrlStr = `/bai-hoc/${lessonSlugStr}?courseSlug=${courseSlugStr}`;

    // Nếu đây là một câu trả lời (reply)
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment && parentComment.user) {
        parentComment.replies.push(newComment._id);
        await parentComment.save();
        
        const recipientId = parentComment.user._id || parentComment.user.userId || parentComment.user.id;
        // Notify the parent comment author
        if (recipientId && recipientId.toString() !== (senderId ? senderId.toString() : "")) {
          await NotificationService.createNotification({
            recipientId: recipientId,
            senderId: senderId,
            type: "comment_reply",
            title: "Có người trả lời bình luận của bạn",
            message: `${user.username || user.name || "Ai đó"} đã trả lời bình luận của bạn.`,
            targetUrl: targetUrlStr
          });
        }
      }
    } else {
      // Notify all teachers and admins for a new root comment
      const teachers = await User.find({ $or: [{ isTeacher: true }, { isAdmin: true }] });
      for (const teacher of teachers) {
        if (teacher._id.toString() !== (senderId ? senderId.toString() : "")) {
          await NotificationService.createNotification({
            recipientId: teacher._id,
            senderId: senderId,
            type: "course_comment",
            title: "Có học sinh bình luận mới",
            message: `${user.username || user.name || "Học sinh"} đã bình luận trong bài học.`,
            targetUrl: targetUrlStr
          });
        }
      }
    }

    return res.status(201).json({ success: true, message: "Bình luận thành công", data: newComment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCommentsByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    
    // Đếm tổng số comment gốc
    const totalComments = await Comment.countDocuments({ lessonId, parentCommentId: null });

    // Chỉ lấy comment gốc (parentCommentId: null) với phân trang
    const comments = await Comment.find({ lessonId, parentCommentId: null })
      .populate("replies")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ 
      success: true, 
      data: comments,
      total: totalComments,
      currentPage: page,
      totalPages: Math.ceil(totalComments / limit),
      hasMore: page * limit < totalComments
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createComment,
  getCommentsByLesson
};
