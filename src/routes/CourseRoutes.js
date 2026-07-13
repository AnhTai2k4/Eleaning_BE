const express = require('express');
const router = express.Router()
const CourseController = require('../controllers/CourseController.js')

router.post('/create-course', CourseController.createCourse)
router.get('/get-all-courses', CourseController.getAllCourses)
router.get('/get-course/:slug', CourseController.getCourse)
router.get('/get-lesson/:lessonSlug', CourseController.getLesson)
router.get('/get-lesson/:courseSlug/:lessonSlug', CourseController.getLesson)
router.put('/update-course/:slug', CourseController.updateCourse)
router.delete('/delete-course/:slug', CourseController.deleteCourse)

module.exports = router