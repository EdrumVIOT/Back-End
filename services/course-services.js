const fs = require('fs');
const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');
const Lesson = require('../models/lesson-model');
const Course = require('../models/course-model');
const LessonViews = require('../models/lesson-view-model')
const { verifyToken } = require('../utils/verifyToken');
const HttpError = require('../middleware/http-error');

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
const createLesson = async ({ accessToken, courseId, filePath, filename, duration, thumbnailPath, thumbnailFilename }) => {
  try {
    if (!accessToken) {
      throw new HttpError('Access token is required', 401);
    }

    const decoded = verifyToken(accessToken);
    if (!['teacher', 'admin'].includes(decoded.role)) {
      throw new HttpError('Only teachers or admins can upload lessons', 403);
    }

    const videoContent = fs.readFileSync(filePath);
    const videoDropboxPath = '/' + filename;

    const videoUpload = await dbx.filesUpload({
      path: videoDropboxPath,
      contents: videoContent,
      autorename: true,
    });

    const videoLink = await dbx.sharingCreateSharedLinkWithSettings({
      path: videoUpload.result.path_lower,
    });

    const videoUrl = videoLink.result.url.replace('?dl=0', '?raw=1');
    fs.unlinkSync(filePath);

    let thumbnailUrl = null;
    if (thumbnailPath && thumbnailFilename) {
      const thumbContent = fs.readFileSync(thumbnailPath);
      const thumbDropboxPath = '/' + thumbnailFilename;

      const thumbUpload = await dbx.filesUpload({
        path: thumbDropboxPath,
        contents: thumbContent,
        autorename: true,
      });

      const thumbLink = await dbx.sharingCreateSharedLinkWithSettings({
        path: thumbUpload.result.path_lower,
      });

      thumbnailUrl = thumbLink.result.url.replace('?dl=0', '?raw=1');
      fs.unlinkSync(thumbnailPath);
    }

    const lesson = new Lesson({
      courseId,
      videoUrl,
      thumbnailUrl,
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


//////////// View Log //////////////////////////////////////////
const logLessonView = async ({ accessToken, lessonId, progress, completed }) => {
  try {
    if (!accessToken) {
      throw new HttpError('Access token is required', 401);
    }

    const decoded = verifyToken(accessToken);

    if (decoded.role !== 'student') {
      console.warn(`[logLessonView] Skipped logging for non-student (role: ${decoded.role})`);
      return { success: true, data: null, skipped: true };
    }

    if (!lessonId || typeof progress !== 'number') {
      throw new HttpError('Lesson ID and progress are required', 422);
    }

    const lessonExists = await Lesson.findById(lessonId);
    if (!lessonExists) {
      throw new HttpError('Lesson not found', 404);
    }

    const existingLog = await LessonViews.findOne({
      studentUserId: decoded.userId,
      lessonId,
    });

    const updateData = {
      watchedAt: new Date(),
      progress,
      completed: !!completed,
    };

    let savedLog;
    if (existingLog) {
      existingLog.set(updateData);
      savedLog = await existingLog.save();
    } else {
      const newLog = new LessonViews({
        studentUserId: decoded.userId,
        lessonId,
        ...updateData,
      });
      savedLog = await newLog.save();
    }

    return { success: true, data: savedLog };
  } catch (err) {
    console.error('[logLessonView error]', err);
    return { success: false, error: err.message };
  }
};


module.exports = {
  createCourse,
  createLesson,
  logLessonView,
};
