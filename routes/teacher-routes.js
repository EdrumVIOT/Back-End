const express = require('express');
const teacherController = require('../controllers/teacher-controller');
const router = express.Router();

// Existing routes
router.post('/getOwnCourses', teacherController.getOwnCourses);
router.post('/getOwnLessons', teacherController.getLessonsByCourseId);
router.post('/createCourse', teacherController.createCourse);
router.post('/uploadLesson', teacherController.uploadLesson);
router.post('/getStudents', teacherController.getOwnStudents);
router.post('/setmeeting', teacherController.setMeeting);
router.post('/changeTeacherPassword', teacherController.changeTeacherPassword);

// Add missing routes
router.put('/updateCourse', teacherController.updateCourse);
router.delete('/deleteCourse/:courseId', teacherController.deleteCourse);
router.put('/updateLesson', teacherController.updateLesson);
router.delete('/deleteLesson/:lessonId', teacherController.deleteLesson);

module.exports = router;
