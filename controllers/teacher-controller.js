const teacherServices = require('../services/teacher-service');

const getOwnCourses = async (req, res, next) => {
  /*
    #swagger.tags = ['Course']
    #swagger.summary = 'Get teacher\'s own courses'
    #swagger.description = 'Returns all courses and lessons created by the logged-in teacher'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer accessToken'
    }
  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const result = await teacherServices.getTeacherCoursesWithLessons(accessToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getOwnCourses };
