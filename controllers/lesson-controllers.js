const { createLesson } = require('../services/course-services');

const uploadLesson = async (req, res) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Upload a lesson video and create lesson'
    #swagger.consumes = ['multipart/form-data']
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      description: 'Bearer access token with admin role',
      type: 'string',
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
    const { courseId, duration, thumbnailUrl } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }
    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }
    if (!duration) {
      return res.status(400).json({ error: 'duration is required' });
    }

    const result = await createLesson({
      courseId,
      duration: Number(duration),
      thumbnailUrl,
      filePath: req.file.path,
      filename: req.file.filename,
    });

    if (result.success) {
      return res.status(201).json({ lesson: result.data });
    }
    return res.status(500).json({ error: result.error });
  } catch (err) {
    console.error('[uploadLesson error]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  uploadLesson,
};
