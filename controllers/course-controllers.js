const Course = require('../services/course-services');

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
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token is missing' });
    }

    const { title, description, level, category, price } = req.body;

    if (!title || typeof price !== 'number') {
      return res.status(422).json({ error: 'Title and price are required and must be valid' });
    }

    const result = await Course.createCourse({
      accessToken,
      title,
      description,
      level,
      category,
      price,
    });

    if (result.success) {
      return res.status(201).json({ course: result.data });
    }

    if (result.error === 'Unauthorized') {
      return res.status(403).json({ error: 'Only admin or teacher can create courses' });
    }

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
    #swagger.summary = 'Upload a lesson video and create lesson (admin or teacher only)'
    #swagger.consumes = ['multipart/form-data']
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer access token',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...'
    }
    #swagger.parameters['video'] = {
      in: 'formData',
      type: 'file',
      required: true,
      description: 'Video file to upload'
    }
    #swagger.parameters['thumbnail'] = {
      in: 'formData',
      type: 'file',
      required: false,
      description: 'Optional thumbnail image file'
    }
    #swagger.parameters['courseId'] = {
      in: 'formData',
      type: 'string',
      required: true,
      description: 'ID of the course',
      example: '64abc12345def67890'
    }
    #swagger.parameters['duration'] = {
      in: 'formData',
      type: 'integer',
      required: true,
      description: 'Video duration in seconds',
      example: 360
    }
  */

  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token is missing' });
    }

    const { courseId, duration } = req.body;

    if (!req.files?.video) {
      return res.status(422).json({ error: 'Video file is required' });
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail?.[0];

    const result = await Course.createLesson({
      accessToken,
      courseId,
      duration: Number(duration),
      filePath: videoFile.path,
      filename: videoFile.filename,
      thumbnailPath: thumbnailFile?.path,
      thumbnailFilename: thumbnailFile?.filename,
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



////// Log Views //////////////////
const viewLesson = async (req, res) => {
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
      lessonId: " ",
      progress: " ",
      completed: " "
      }
    }
  */

  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { lessonId, progress, completed } = req.body;

    const result = await Course.logLessonView({
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
    return res.status(503).json({ error: 'Service unavailable' });
  }
};


module.exports = {
  createCourse,
  uploadLesson,
  viewLesson,
};
