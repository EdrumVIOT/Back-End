const express = require('express');
const router = express.Router();

const courseController = require('../controllers/course-controllers');

// ---------- Course Routes ----------
router.post('/createCourse', courseController.createCourse);
router.post('/uploadLesson', courseController.uploadLesson);
router.post('/logViews', courseController.viewLesson);

module.exports = router;
