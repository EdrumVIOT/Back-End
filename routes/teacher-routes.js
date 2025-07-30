const express = require('express');
const teacherController = require('../controllers/teacher-controller');
const router = express.Router();

router.post('/getOwnCourses', teacherController.getOwnCourses);

  
module.exports = router;
