const teacherServices = require('../services/teacher-service');


//////////// Get Own Courses ////////////////////////////
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
    return res.status(200).json(result);
  } catch (err) {
    console.error('[getOwnCourses error]', err);
    return res.status(503).json({ error: 'Service unavailable: ' + err.message });
  }
};


//////////// Get Enrolled Students ////////////////////////////
const getOwnStudents = async (req, res, next) => {
  /*
    #swagger.tags = ['Course']
    #swagger.summary = 'Get students enrolled in teacher\'s courses'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer accessToken'
    }
  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const result = await teacherServices.getEnrolledStudentsInMyCourses(accessToken);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[getOwnStudents error]', err);
    return res.status(503).json({ error: 'Service unavailable: ' + err.message });
  }
};


//////////// Create Course //////////////////////////////
const createCourse = async (req, res) => {
  /*
    #swagger.tags = ['Course']
    #swagger.summary = 'Create a new course (admin or teacher only)'
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
        title: "Beginner Piano Course",
        description: "Learn piano from scratch.",
        level: "beginner",
        category: "music",
        price: 49.99
      }
    }
  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { title, description, level, category, price } = req.body;

    if (!accessToken) return res.status(401).json({ error: 'Access token is missing' });
    if (!title || typeof price !== 'number') {
      return res.status(422).json({ error: 'Title and price are required and must be valid' });
    }

    const result = await teacherServices.createCourse({ accessToken, title, description, level, category, price });

    if (result.success) return res.status(201).json({ course: result.data });
    if (result.error === 'Unauthorized') return res.status(403).json({ error: 'Only admin or teacher can create courses' });

    return res.status(503).json({ error: result.error || 'Service unavailable while creating course' });
  } catch (err) {
    console.error('[createCourse error]', err);
    return res.status(503).json({ error: 'Service unavailable: ' + err.message });
  }
};


//////////// Upload Lesson /////////////////////////////
const uploadLesson = async (req, res) => {
  /*
  #swagger.tags = ['Lesson']
  #swagger.summary = 'Create a lesson (admin or teacher only)'
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
            courseId: " ",
            duration: " ",
            videoUrl: " ",
            thumbnailUrl: " "
      }
    }
*/
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { courseId, duration, videoUrl, thumbnailUrl } = req.body;

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token is missing' });
    }

    if (!courseId || !duration || !videoUrl) {
      return res.status(422).json({ error: 'courseId, duration, and videoUrl are required' });
    }

    const result = await teacherServices.createLesson({
      accessToken,
      courseId,
      duration: Number(duration),
      videoUrl,
      thumbnailUrl,
    });

    if (result.success) {
      return res.status(201).json({ lesson: result.data });
    }

    if (result.error === 'Unauthorized') {
      return res.status(403).json({ error: 'Only admin or teacher can upload lessons' });
    }

    return res.status(503).json({ error: result.error || 'Service unavailable while uploading lesson' });
  } catch (err) {
    console.error('[uploadLesson error]', err);
    return res.status(503).json({ error: 'Service unavailable: ' + err.message });
  }
};



///////// Set Meeting Time //////////////
const setMeeting = async (req, res) => {
  /*
    #swagger.tags = ['Meeting']
    #swagger.summary = 'Set meeting time (teacher only)'
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
        date: "2025-08-01T00:00:00Z",
        startTime: "13:00",
        endTime: "13:30",
        price: 10
      }
    }
  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { date, startTime, endTime, price } = req.body;

    const result = await teacherServices.setMeetingTime({ accessToken, date, startTime, endTime, price });

    if (result.success) return res.status(200).json(result);

    const status = result.error.includes('token')
      ? 401
      : result.error.includes('Only teachers')
        ? 403
        : 503;

    return res.status(status).json({ success: false, error: result.error });
  } catch (err) {
    console.error('[setMeeting error]', err);
    return res.status(503).json({ error: 'Service unavailable: ' + err.message });
  }
};


//////// Change Teacher Password /////////////
const changeTeacherPassword = async (req, res) => {
  /*
    #swagger.tags = ['Meeting']
    #swagger.summary = 'Set meeting time (teacher only)'
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
        currentPassword: " ", 
        newPassword : " "
      }
    }
  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { currentPassword, newPassword  } = req.body;

    const result = await teacherServices.changeTeacherPassword({ accessToken, currentPassword, newPassword });

    if (result.success) return res.status(200).json(result);

    const status = result.error.includes('token')
      ? 401
      : result.error.includes('Only teachers')
        ? 403
        : 503;

    return res.status(status).json({ success: false, error: result.error });
  } catch (err) {
    console.error('[Teacher password change error]', err);
    return res.status(503).json({ error: 'Service unavailable: ' + err.message });
  }
};



module.exports = {
  getOwnCourses,
  getOwnStudents,
  createCourse,
  uploadLesson,
  setMeeting,
  changeTeacherPassword
};
