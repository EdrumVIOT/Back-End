const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student-controllers');


router.get('/getEnrolledCources', studentController.getEnrolledCourses);

router.get('/getAllCources', studentController.getAllCourses);

router.post('/rateLesson', studentController.rateLessonController);

router.post('/logViews', studentController.viewLesson);

router.post('/bookMeeting', studentController.bookMeeting);



module.exports = router;
