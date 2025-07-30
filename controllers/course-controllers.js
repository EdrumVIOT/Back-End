const { createLesson, createCourse: createCourseService } = require('../services/course-services');

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
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            title: "CreateCourseRequest",
            required: ["title", "price"],
            properties: {
              title: { type: "string", example: "Beginner Piano Course" },
              description: { type: "string", example: "Learn piano from scratch." },
              level: { type: "string", example: "beginner" },
              category: { type: "string", example: "music" },
              price: { type: "number", example: 49.99 }
            }
          }
        }
      }
    }
    #swagger.responses[201] = {
      description: 'Course successfully created'
    }
    #swagger.responses[401] = {
      description: 'Unauthorized - access token missing or invalid'
    }
    #swagger.responses[403] = {
      description: 'Forbidden - not allowed to create course'
    }
    #swagger.responses[422] = {
      description: 'Validation error - missing or invalid input'
    }
    #swagger.responses[503] = {
      description: 'Service unavailable or internal failure'
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

    const result = await createCourseService({
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
    #swagger.parameters['thumbnailUrl'] = {
      in: 'formData',
      type: 'string',
      required: false,
      description: 'Optional URL of the lesson thumbnail',
      example: 'https://example.com/thumb.jpg'
    }

  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token is missing' });
    }

    const { courseId, duration, thumbnailUrl } = req.body;

    if (!req.file) {
      return res.status(422).json({ error: 'Video file is required' });
    }

    if (!courseId || !duration) {
      return res.status(422).json({ error: 'courseId and duration are required' });
    }

    const result = await createLesson({
      accessToken,
      courseId,
      duration: Number(duration),
      thumbnailUrl,
      filePath: req.file.path,
      filename: req.file.filename,
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

module.exports = {
  createCourse,
  uploadLesson,
};
