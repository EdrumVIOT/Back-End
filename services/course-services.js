const fs = require('fs');
const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');
const Lesson = require('../models/lesson-model');
const Course = require('../models/course-model');
const { verifyToken } = require('../utils/verifyToken');
const HttpError = require('../utils/HttpError');

const dbx = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
  fetch,
});

//////////////////// CREATE COURSE ////////////////////
const createCourse = async ({ accessToken, title, description, level, category, price }) => {
  try {
    if (!accessToken) {
      throw new HttpError('Access token is required', 401);
    }

    const decoded = verifyToken(accessToken);

    if (!['teacher', 'admin'].includes(decoded.role)) {
      throw new HttpError('Only teachers or admins can create courses', 403);
    }

    const course = new Course({
      teacherUserId: decoded.userId,
      title,
      description,
      level,
      category,
      price,
    });

    const savedCourse = await course.save();

    return { success: true, data: savedCourse };
  } catch (err) {
    console.error('[createCourse error]', err);
    return { success: false, error: err.message || 'Failed to create course' };
  }
};

//////////////////// CREATE LESSON ////////////////////
const createLesson = async ({ accessToken, courseId, filePath, filename, duration, thumbnailUrl }) => {
  try {
    if (!accessToken) {
      throw new HttpError('Access token is required', 401);
    }

    const decoded = verifyToken(accessToken);

    if (!['teacher', 'admin'].includes(decoded.role)) {
      throw new HttpError('Only teachers or admins can upload lessons', 403);
    }

    const fileContent = fs.readFileSync(filePath);
    const dropboxUploadPath = '/' + filename;

    const uploadResult = await dbx.filesUpload({
      path: dropboxUploadPath,
      contents: fileContent,
      autorename: true,
    });

    const sharedLink = await dbx.sharingCreateSharedLinkWithSettings({
      path: uploadResult.result.path_lower,
    });

    const videoUrl = sharedLink.result.url.replace('?dl=0', '?raw=1');

    fs.unlinkSync(filePath);

    const lesson = new Lesson({
      courseId,
      videoUrl,
      thumbnailUrl: thumbnailUrl || null,
      duration,
      views: 0,
      status: true,
    });

    const savedLesson = await lesson.save();

    return { success: true, data: savedLesson };
  } catch (err) {
    console.error('[createLesson error]', err);
    return { success: false, error: err.message || 'Failed to create lesson' };
  }
};

module.exports = {
  createCourse,
  createLesson,
};
