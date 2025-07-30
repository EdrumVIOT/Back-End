const studentServices = require('../services/student-services');

///////////////////// Get Enrolled Courses ////////////////////////////////
const getEnrolledCourses = async (req, res, next) => {
  /*
    #swagger.tags = ['Course']
    #swagger.summary = 'Get Enrolled Courses with Lessons'
    #swagger.description = 'Returns all courses a student is enrolled in with their lessons'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer accessToken'
    }
  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const result = await studentServices.getStudentCoursesWithLessons(accessToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


////////////////////// Get All Courses ////////////////////////////////
const getAllCourses = async (req, res, next) => {
  /*
    #swagger.tags = ['Course']
    #swagger.summary = 'Get All Courses with Lessons'
    #swagger.description = 'Returns all available courses and their lessons'
  */
  try {
    const result = await studentServices.getAllCoursesWithLessons();
    res.status(200).json(result);
  } catch (err) {
    console.error('[GET All Courses Error]', err.message || err);
    next(err);
  }
};


////////////////////// Rate a Lesson ////////////////////////////////
const rateLessonController = async (req, res, next) => {
  /*
    #swagger.tags = ['Lesson']
    #swagger.summary = 'Rate a Lesson'
    #swagger.description = 'Allows a student to rate a lesson (1 to 5 stars)'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer accessToken'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        lessonId: "lesson_object_id",
        rating: 5
      }
    }
  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { lessonId, rating } = req.body;

    if (!lessonId || typeof rating !== 'number') {
      return res.status(400).json({ error: 'lessonId and numeric rating are required' });
    }

    const result = await studentServices.rateLesson(accessToken, lessonId, rating);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


////////////////////// Log Lesson View ////////////////////////////////
const viewLesson = async (req, res, next) => {
  /*
    #swagger.tags = ['Lesson']
    #swagger.summary = 'Log lesson view progress'
    #swagger.description = 'Students can track viewing progress of a lesson'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer access token',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        lessonId: "lesson_object_id",
        progress: 70,
        completed: false
      }
    }
  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { lessonId, progress, completed } = req.body;

    if (!lessonId || typeof progress !== 'number' || typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'lessonId, numeric progress, and boolean completed are required' });
    }

    const result = await studentServices.logLessonView({
      accessToken,
      lessonId,
      progress,
      completed,
    });

    if (result.success) {
      return res.status(200).json({ log: result.data });
    }

    return res.status(400).json({ error: result.error });
  } catch (err) {
    console.error('[viewLesson controller]', err);
    return next(err);
  }
};


////////////////////// Book a Meeting ////////////////////////////////
const bookMeeting = async (req, res, next) => {
  /*
    #swagger.tags = ['Booking']
    #swagger.summary = 'Book a meeting (Student only)'
    #swagger.description = 'Allows a student to book a teacher meeting slot'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer access token',
      example: 'Bearer eyJhbGciOi...'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        meetingId: "meeting_object_id",
        method: "zoom"
      }
    }
  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { meetingId, method } = req.body;

    if (!meetingId || !method) {
      return res.status(400).json({ error: 'meetingId and method are required' });
    }

    const result = await studentServices.bookMeeting({ accessToken, meetingId, method });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};



module.exports = {
  getEnrolledCourses,
  getAllCourses,
  rateLessonController,
  viewLesson,
  bookMeeting
};
