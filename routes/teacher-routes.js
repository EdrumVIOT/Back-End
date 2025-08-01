const express = require('express');
const teacherController = require('../controllers/teacher-controller');
const router = express.Router();

router.post('/getOwnCourses', teacherController.getOwnCourses);
router.post('/getOwnLessons', teacherController.getLessonsByCourseId);
router.post('/createCourse', teacherController.createCourse);
router.post('/uploadLesson', teacherController.uploadLesson);
router.post('/getStudents', teacherController.getOwnStudents);
router.post('/setmeeting', teacherController.setMeeting);
router.post('/changeTeacherPassword', teacherController.changeTeacherPassword);


  
module.exports = router;
