const Comment = require("../models/CommentModel");

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

    // Nếu đây là một câu trả lời (reply)
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment) {
        parentComment.replies.push(newComment._id);
        await parentComment.save();
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
