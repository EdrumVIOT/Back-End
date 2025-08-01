const Lesson = require('../models/lesson-model');
const Course = require('../models/course-model');
const Meeting = require('../models/meeting-model');
const CourseEnrollment = require('../models/course-enroll-model');
const User = require('../models/user-model');
const { verifyToken } = require('../utils/verifyToken');
const HttpError = require('../middleware/http-error');



/////////////// Get Teacher's Courses ////////////////////
const getOwnCourses = async (accessToken) => {
  try {
    if (!accessToken) throw new HttpError('Access token is required', 401);
    const decoded = verifyToken(accessToken);
    if (decoded.role !== 'teacher') throw new HttpError('Only teachers can access their own courses', 403);

    const courses = await Course.find({ teacherId: decoded.userId });
    return { success: true, data: courses };
  } catch (err) {
    console.error('[getOwnCourses Error]', err);
    throw new HttpError(err.message || 'Failed to get teacher courses', 503);
  }
};


//////////// Get Lessons /////////////////////////////////////////////////////
const getLessonsByCourseId = async (accessToken, courseId) => {
  try {
    if (!accessToken) throw new HttpError('Access token is required', 401);
    if (!courseId) throw new HttpError('Course ID is required', 400);
    
    const decoded = verifyToken(accessToken);
    if (decoded.role !== 'teacher') throw new HttpError('Only teachers can access course lessons', 403);

    // Optional: Verify that this course belongs to the teacher
    const course = await Course.findOne({ _id: courseId, teacherId: decoded.userId });
    if (!course) throw new HttpError('Course not found or not owned by you', 404);

    const lessons = await Lesson.find({ courseId });
    return { success: true, data: { course, lessons } };
  } catch (err) {
    console.error('[getLessonsByCourseId Error]', err);
    throw new HttpError(err.message || 'Failed to get lessons', 503);
  }
};



//////////////////////// Create Course //////////////////////////////////////////////////////////
const createCourse = async ({ accessToken, title, description, level, category, price }) => {
  try {
    if (!accessToken) throw new HttpError('Access token is required', 401);
    const decoded = verifyToken(accessToken);
    if (!['teacher', 'admin'].includes(decoded.role)) throw new HttpError('Only teachers or admins can create courses', 403);

    const course = new Course({ teacherUserId: decoded.userId, title, description, level, category, price });
    const savedCourse = await course.save();
    return { success: true, data: savedCourse };
  } catch (err) {
    console.error('[createCourse error]', err);
    throw new HttpError(err.message || 'Failed to create course', 503);
  }
};


////////// Create Lesson ////////////////////////////////////////////////////////////////
const createLesson = async ({ accessToken, courseId, videoUrl, duration, thumbnailUrl }) => {
  try {
    if (!accessToken) throw new HttpError('Access token is required', 401);

    const decoded = verifyToken(accessToken);
    if (decoded.role !== "teacher" || decoded.role !== "admin") {
      throw new HttpError('Only teachers or admins can upload lessons', 403);
    }

    if (!videoUrl || !courseId || !duration) {
      throw new HttpError('Missing required fields', 400);
    }

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
    throw new HttpError(err.message || 'Failed to create lesson', 503);
  }
};


/////////// Get Enrolled Students ///////////////////////////////
const getEnrolledStudentsInMyCourses = async (accessToken) => {
  try {
    if (!accessToken) throw new HttpError('Access token is required', 401);
    const decoded = verifyToken(accessToken);
    if (decoded.role !== 'teacher') throw new HttpError('Only teachers can view enrolled students', 403);

    const teacherUserId = decoded.userId;
    const courses = await Course.find({ teacherUserId });
    const courseIdSet = new Set(courses.map(course => course._id.toString()));
    const enrollments = await CourseEnrollment.find({ courseId: { $in: Array.from(courseIdSet) } });

    const studentIdSet = new Set(enrollments.map(enr => enr.studentUserId));
    const students = await User.find({ userId: { $in: Array.from(studentIdSet) } });

    const studentMap = {};
    enrollments.forEach(enr => {
      const sid = enr.studentUserId;
      const course = courses.find(c => c._id.toString() === enr.courseId.toString());
      if (!studentMap[sid]) studentMap[sid] = { studentUserId: sid, enrolledCourses: [course] };
      else studentMap[sid].enrolledCourses.push(course);
    });
    students.forEach(stu => {
      if (studentMap[stu.userId]) studentMap[stu.userId].studentInfo = stu;
    });

    return { success: true, data: Object.values(studentMap) };
  } catch (err) {
    console.error('[getEnrolledStudentsInMyCourses Error]', err);
    throw new HttpError(err.message || 'Failed to get students', 503);
  }
};


///////////////// Set Meeting Time //////////////////////////////////////////////
const setMeetingTime = async ({ accessToken, date, startTime, endTime, price }) => {
  try {
    if (!accessToken) throw new HttpError('Access token is required', 401);
    const decoded = verifyToken(accessToken);
    if (decoded.role !== 'teacher') throw new HttpError('Only teachers can set meetings', 403);

    const meeting = new Meeting({ teacherId: decoded.userId, date, startTime, endTime, price, status: 'available' });
    const savedMeeting = await meeting.save();
    return { success: true, data: savedMeeting };
  } catch (err) {
    console.error('[setMeetingTime error]', err);
    throw new HttpError(err.message || 'Failed to set meeting time', 503);
  }
};


/////////////////// Change Teacher Password ///////////////////////////////////////////
const changeTeacherPassword = async ({ accessToken, currentPassword, newPassword }) => {
  try {
    if (!accessToken) throw new HttpError('Access token is required', 401);
    const decoded = verifyToken(accessToken);
    console.log("Decoded teacher ", decoded )

    if (decoded.role !== 'teacher') {
      throw new HttpError('Only teachers can change their password', 403);
    }
    const user = await User.findOne({ userId: decoded.userId });
    if (!user) throw new HttpError('Teacher not found', 404);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new HttpError('Current password is incorrect', 400);
    }

    user.password = newPassword;

    await user.save();

    return { success: true, message: 'Password updated successfully' };
  } catch (err) {
    console.error('[changeTeacherPassword error]', err);
    throw new HttpError(err.message || 'Failed to change password', 503);
  }
};



module.exports = {
  createCourse,
  createLesson,
  getOwnCourses,
  getLessonsByCourseId,
  getEnrolledStudentsInMyCourses,
  setMeetingTime,
  changeTeacherPassword
};
