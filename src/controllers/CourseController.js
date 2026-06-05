const Course = require('../models/CourseModel');

// 1. Create a course
const createCourse = async (req, res) => {
  try {
    const { title, slug, price } = req.body;
    if (!title || !slug || price === undefined) {
      return res.status(400).json({ status: 'ERR', message: 'Thiếu thông tin bắt buộc (title, slug, price)' });
    }

    const newCourse = await Course.create(req.body);
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 2. Get all courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ slug: 1 });
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 3. Get single course by slug
const getCourse = async (req, res) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug });
    if (!course) {
      return res.status(404).json({ status: 'ERR', message: 'Không tìm thấy khóa học' });
    }
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 4. Get lesson inside a course
const getLesson = async (req, res) => {
  try {
    const { courseSlug, lessonSlug } = req.params;
    const course = await Course.findOne({ slug: courseSlug });
    if (!course) {
      return res.status(404).json({ status: 'ERR', message: 'Không tìm thấy khóa học' });
    }

    let foundLesson = null;
    let foundSectionTitle = '';

    if (course.sections) {
      for (const section of course.sections) {
        const les = section.lessons.find(l => l.slug === lessonSlug);
        if (les) {
          foundLesson = les;
          foundSectionTitle = section.sectionTitle;
          break;
        }
      }
    }

    if (!foundLesson) {
      return res.status(404).json({ status: 'ERR', message: 'Không tìm thấy bài học' });
    }

    let videoUrl = '';
    if (foundLesson.videoType === 'youtube') {
      videoUrl = `https://www.youtube.com/embed/${foundLesson.videoId}`;
    } else if (foundLesson.videoType === 'vimeo') {
      videoUrl = `https://player.vimeo.com/video/${foundLesson.videoId}`;
    } else if (foundLesson.videoType === 'bunny') {
      videoUrl = `https://iframe.mediadelivery.net/embed/${foundLesson.videoId}`;
    } else {
      videoUrl = `https://www.youtube.com/embed/${foundLesson.videoId}`;
    }

    const responseData = {
      ...foundLesson.toObject(),
      courseTitle: course.title,
      sectionTitle: foundSectionTitle,
      videoUrl
    };

    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 5. Update course by slug
const updateCourse = async (req, res) => {
  try {
    const { slug } = req.params;
    const updated = await Course.findOneAndUpdate({ slug }, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ status: 'ERR', message: 'Không tìm thấy khóa học' });
    }
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 6. Delete course by slug
const deleteCourse = async (req, res) => {
  try {
    const { slug } = req.params;
    const deleted = await Course.findOneAndDelete({ slug });
    if (!deleted) {
      return res.status(404).json({ status: 'ERR', message: 'Không tìm thấy khóa học' });
    }
    res.status(200).json({ status: 'OK', message: 'Xóa khóa học thành công' });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourse,
  getLesson,
  updateCourse,
  deleteCourse
};
