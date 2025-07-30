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

////////////////  Get All Courses /////////////////////////////////////
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

////////////////////// Rate a Lesson ///////////////////////////////////////////////
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
        lessonId: " ",
        rating: 5,

      }
    }
  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { lessonId , rating } = req.body;

    const result = await studentServices.rateLesson(accessToken, lessonId, rating);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getEnrolledCourses,
  getAllCourses,
  rateLessonController,
};
