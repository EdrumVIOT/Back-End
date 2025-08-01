const Course = require('../models/course-model');
const Lesson = require('../models/lesson-model');
const CourseEnrollment = require('../models/course-enroll-model');
const LessonViews = require('../models/lesson-view-model');
const Booking = require('../models/booking-model');
const Meeting = require('../models/meeting-model');
const Rating = require('../models/rating-model');
const { verifyToken } = require("../utils/verifyToken");
const HttpError = require('../middleware/http-error');


/////////  Get enrolled courses with their lessons ///////////
const getStudentCoursesWithLessons = async (accessToken) => {
  try {
    if (!accessToken) throw new HttpError('Access token missing', 401);

    const { userId } = verifyToken(accessToken);

    const enrollments = await CourseEnrollment.find({ studentUserId: userId });
    const courseIds = enrollments.map(e => e.courseId);

    const courses = await Course.find({ _id: { $in: courseIds } });
    const lessons = await Lesson.find({ courseId: { $in: courseIds } });

    const courseMap = {};
    courses.forEach(course => {
      courseMap[course._id] = { course, lessons: [] };
    });

    lessons.forEach(lesson => {
      if (courseMap[lesson.courseId]) {
        courseMap[lesson.courseId].lessons.push(lesson);
      }
    });

    return { success: true, data: Object.values(courseMap) };

  } catch (err) {
    console.error('[getStudentCoursesWithLessons]', err);
    throw new HttpError(err.message || 'Failed to get enrolled courses', 503);
  }
};


////////// Get all courses with their lessons /////////////////////////
const getAllCoursesWithLessons = async () => {
  try {
    const courses = await Course.find().lean();
    const lessons = await Lesson.find().lean();

    const courseMap = {};
    courses.forEach(course => {
      courseMap[course._id.toString()] = { course, lessons: [] };
    });

    lessons.forEach(lesson => {
      const courseId = lesson.courseId?.toString();
      if (courseMap[courseId]) {
        courseMap[courseId].lessons.push(lesson);
      }
    });

    return { success: true, data: Object.values(courseMap) };
  } catch (err) {
    console.error('[getAllCoursesWithLessons Error]', err);
    throw new HttpError('Failed to fetch courses with lessons.', 503);
  }
};


///////  Rate a lesson ////////////////////////////////////////////
const rateLesson = async (accessToken, lessonId, ratingValue) => {
  try {
    if (!accessToken) throw new HttpError('Access token required', 401);
    if (!lessonId || typeof ratingValue !== 'number') throw new HttpError('Invalid input', 422);
    if (ratingValue < 1 || ratingValue > 5) throw new HttpError('Rating must be 1-5', 422);

    const { userId } = verifyToken(accessToken);

    const existingRating = await Rating.findOne({ lessonId, userId });
    let result;

    if (existingRating) {
      existingRating.rating = ratingValue;
      result = await existingRating.save();
    } else {
      result = await Rating.create({ lessonId, userId, rating: ratingValue });
    }

    return { success: true, data: result };
  } catch (err) {
    console.error('[rateLesson Error]', err);
    throw new HttpError(err.message || 'Failed to rate lesson', 503);
  }
};


////// Log lesson view ////////////////////////////////////////////////////////
const logLessonView = async ({ accessToken, lessonId, progress, completed }) => {
  try {
    if (!accessToken) throw new HttpError('Access token is required', 401);

    const decoded = verifyToken(accessToken);
    if (decoded.role !== 'student') return { success: true, data: null, skipped: true };

    if (!lessonId || typeof progress !== 'number') {
      throw new HttpError('Lesson ID and progress are required', 422);
    }

    const lessonExists = await Lesson.findById(lessonId);
    if (!lessonExists) throw new HttpError('Lesson not found', 404);

    const existingLog = await LessonViews.findOne({ studentUserId: decoded.userId, lessonId });
    const updateData = { watchedAt: new Date(), progress, completed: !!completed };

    let savedLog;
    if (existingLog) {
      existingLog.set(updateData);
      savedLog = await existingLog.save();
    } else {
      savedLog = await LessonViews.create({ studentUserId: decoded.userId, lessonId, ...updateData });
    }

    return { success: true, data: savedLog };
  } catch (err) {
    console.error('[logLessonView error]', err);
    throw new HttpError(err.message || 'Failed to log view', 503);
  }
};


//////////////////// Book meeting ///////////////////////////////////
const bookMeeting = async ({ accessToken, meetingId, method }) => {
  try {
    if (!accessToken) throw new HttpError('Access token required', 401);

    const decoded = verifyToken(accessToken);
    if (decoded.role !== 'student') throw new HttpError('Only students can book meetings', 403);

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new HttpError('Meeting not found', 404);

    const booking = await Booking.create({
      meetingId,
      studentId: decoded.userId,
      method,
      status: 'pending',
      paidAt: new Date(),
    });

    return { success: true, data: booking };
  } catch (err) {
    console.error('[bookMeeting error]', err);
    throw new HttpError(err.message || 'Failed to book meeting', 503);
  }
};



module.exports = {
  getStudentCoursesWithLessons,
  getAllCoursesWithLessons,
  rateLesson,
  logLessonView,
  bookMeeting,
};
