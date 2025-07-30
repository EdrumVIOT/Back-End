const Course = require('../models/course-model');
const Lesson = require('../models/lesson-model');
const CourseEnrollment = require('../models/course-enroll-model');
const { verifyToken } = require("../utils/verifyToken");


const getStudentCoursesWithLessons = async (accessToken) => {
  try {
    if (!accessToken) {
      throw new Error('Access token missing');
    }

    const decoded = verifyToken(accessToken);
    const studentUserId = decoded.userId; 

    const enrollments = await CourseEnrollment.find({ studentUserId });
    const courseIds = enrollments.map(e => e.courseId);

    const courses = await Course.find({ _id: { $in: courseIds } });

    const lessons = await Lesson.find({ courseId: { $in: courseIds } });

    const courseMap = {};
    courses.forEach(course => {
      courseMap[course._id] = {
        course,
        lessons: []
      };
    });

    lessons.forEach(lesson => {
      if (courseMap[lesson.courseId]) {
        courseMap[lesson.courseId].lessons.push(lesson);
      }
    });

    return { success: true, data: Object.values(courseMap) };

  } catch (err) {
    console.error(err);
    throw new Error(err.message || 'Server error');
  }
};
/////////////////// Get Enrolled Courses ////////////////////


const getAllCoursesWithLessons = async () => {
  try {
    const courses = await Course.find().lean();
    const lessons = await Lesson.find().lean();

    const courseMap = {};

    courses.forEach(course => {
      courseMap[course._id.toString()] = {
        course,
        lessons: []
      };
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
    throw new Error('Failed to fetch courses with lessons.');
  }
};

///////////////// Get All Cources /////////////////////////


const rateLesson = async (accessToken, lessonId, ratingValue) => {
  try {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    if (!lessonId || typeof ratingValue !== 'number') {
      throw new Error('Lesson ID and numeric rating are required');
    }

    if (ratingValue < 1 || ratingValue > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const decoded = verifyToken(accessToken);
    const userId = decoded.userId; 

    const existingRating = await Rating.findOne({ lessonId, userId });

    let result;
    if (existingRating) {
      existingRating.rating = ratingValue;
      result = await existingRating.save();
    } else {
      result = await Rating.create({
        lessonId,
        userId,
        rating: ratingValue,
      });
    }

    return { success: true, data: result };
    
  } catch (err) {
    console.error('[rateLesson Error]', err);
    return { success: false, message: err.message || 'Server error' };
  }
};

module.exports = { getStudentCoursesWithLessons ,getAllCoursesWithLessons , rateLesson};
