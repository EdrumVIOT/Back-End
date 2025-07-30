const fs = require('fs');
const path = require('path');
const { Dropbox } = require('dropbox');
const Lesson = require('../models/lesson-model');
const fetch = require('node-fetch'); 

const dbx = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
  fetch,
});


const createLesson = async ({accessToken, courseId, filePath, filename, duration, thumbnailUrl }) => {
  try {

    if (!accessToken) {
      throw new Error('Access token is required');
    }

    const decoded = verifyToken(accessToken);

    if ( decoded.role !== 'admin' || decoded.role !== 'teacher') {
          throw new HttpError('Unauthorized: Admin or teacher access required.', 403);
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
    return { success: false, error: err.message };
  }
};

module.exports = { createLesson };
