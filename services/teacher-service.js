const Course = require('../models/course-model');
const Lesson = require('../models/lesson-model');
const { verifyToken } = require('../utils/verifyToken');


//////////// Get Own Lessons
const getTeacherCoursesWithLessons = async (accessToken) => {
  try {
    if (!accessToken) {
      throw new Error('Access token missing');
    }

    const decoded = verifyToken(accessToken);
    const teacherUserId = decoded.userId;

    if (decoded.role !== 'teacher') {
      throw new Error('Only teachers can access their own courses');
    }
    
    const courses = await Course.find({ teacherId: teacherUserId });
    const courseIds = courses.map(course => course._id);
    const lessons = await Lesson.find({ courseId: { $in: courseIds } });

    const courseMap = {};
    courses.forEach(course => {
      courseMap[course._id.toString()] = {
        course,
        lessons: [],
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
    console.error('[getTeacherCoursesWithLessons Error]', err);
    throw new Error(err.message || 'Server error');
  }
};

module.exports = getTeacherCoursesWithLessons;
