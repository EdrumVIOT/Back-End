const User = require('../models/user-model');
const Course = require('../models/course-model');
const Product = require('../models/product-model');
const Order = require('../models/order-model');
const Cart = require('../models/cart-model');  
const HttpError = require('../middleware/http-error');
const { verifyToken } = require('../utils/verifyToken'); 


//////////////////// Admin Login ////////////////////
const adminLogin = async ({ phoneNumber, password }) => {
  if (!phoneNumber) throw new HttpError('Phone number is required.', 400);
  if (!password) throw new HttpError('Password is required.', 400);

  const user = await User.findOne({ phoneNumber });
  if (!user) throw new HttpError('User not found.', 404);
  if (!user.isVerified) throw new HttpError('Account not verified.', 401);
  if (user.role === 'student') throw new HttpError('Students cannot log in.', 403);

  const isValid = await user.comparePassword(password);
  if (!isValid) throw new HttpError('Invalid credentials.', 401);

  user.lastLogin = Date.now();
  await user.save();

  return {
    message: 'Login successful',
    accessToken: user.generateAccessToken(),
    refreshToken: user.generateRefreshToken(),
  };
};


//////////////////// Create User  ////////////////////
const createUser = async (accessToken, userData) => {
  const decoded = verifyToken(accessToken);
  if (decoded.role !== 'admin') throw new HttpError('Admin access required.', 403);

  const { firstName, lastName, email, phoneNumber, password, role } = userData;
  if (!['teacher'].includes(role)) throw new HttpError('Invalid role.', 400);

  const existing = await User.findOne({ $or: [{ email }, { phoneNumber }] });
  if (existing) throw new HttpError('Email or phone already in use.', 400);

  const newUser = new User({ firstName, lastName, email, phoneNumber, password, role, isVerified: true });
  await newUser.save();

  return { message: 'User created', user: newUser };
};


//////////////////// Admin Dashboard ////////////////////
const getAdminDashboardStats = async (accessToken) => {
  const response = { status: 'success', data: {}, timestamp: new Date().toISOString() };
  const decoded = verifyToken(accessToken);

  if (decoded.error) {
    return { status: 'error', error: decoded.error };
  }

  if (decoded.role !== 'admin') {
    return { status: 'error', error: 'Admin access required' };
  }

  try {
    const [totalUsers, totalCourses, totalProducts, teachers, courses, shippedOrders] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Product.countDocuments(),
      User.find({ role: 'teacher' }),
      Course.find().populate('students'),
      Order.find({ status: 'shipped' }).populate({
        path: 'cartId',
        populate: {
          path: 'items.productId',
        },
      }),
    ]);

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let currentCourseRevenue = 0;
    let lastCourseRevenue = 0;
    courses.forEach((course) => {
      const price = parseFloat(course.price) || 0;
      course.students?.forEach((s) => {
        const enrolled = new Date(s.enrolledAt || course.createdAt);
        if (enrolled >= currentMonth) currentCourseRevenue += price;
        else if (enrolled >= lastMonth) lastCourseRevenue += price;
      });
    });

    let currentShopRevenue = 0;
    let lastShopRevenue = 0;
    shippedOrders.forEach((order) => {
      const shippedDate = new Date(order.updatedAt || order.createdAt);
      const items = order.cartId?.items || [];
      const total = items.reduce(
        (sum, item) => sum + ((item.productId?.price || 0) * item.quantity),
        0
      );
      if (shippedDate >= currentMonth) currentShopRevenue += total;
      else if (shippedDate >= lastMonth) lastShopRevenue += total;
    });

    response.data = {
      totalUsers,
      totalCourses,
      totalProducts,
      activeTeachers: teachers.filter((t) =>
        courses.some((c) => c.teacherId?.toString() === t._id.toString())
      ).length,
      monthlyCourseRevenue: currentCourseRevenue,
      monthlyShopRevenue: currentShopRevenue,
      totalRevenue: currentCourseRevenue + currentShopRevenue,
      monthlyGrowthRate: lastCourseRevenue
        ? (((currentCourseRevenue - lastCourseRevenue) / lastCourseRevenue) * 100).toFixed(2)
        : 'N/A',
      shopGrowthRate: lastShopRevenue
        ? (((currentShopRevenue - lastShopRevenue) / lastShopRevenue) * 100).toFixed(2)
        : 'N/A',
    };

    return response;
  } catch (err) {
    return {
      status: 'error',
      error: err.message || 'Failed to load admin stats',
      timestamp: new Date().toISOString(),
    };
  }
};



//////////////////// Update User  ////////////////////
const updateUser = async (accessToken, userId, updateData) => {
  const decoded = verifyToken(accessToken);
  if (decoded.role !== 'admin') throw new HttpError('Admin access required.', 403);

  const user = await User.findOne({ userId });
  if (!user) throw new HttpError('User not found.', 404);

  ['firstName', 'lastName', 'email', 'phoneNumber', 'role'].forEach(field => {
    if (updateData[field] !== undefined) user[field] = updateData[field];
  });

  await user.save();
  return { message: 'User updated', user };
};


///////////// Delete User ////////////////////////////
const deleteUser = async (accessToken, userId) => {
  const decoded = verifyToken(accessToken);
  if (decoded.role !== 'admin') throw new HttpError('Admin access required.', 403);

  const user = await User.findOneAndDelete({ userId });
  if (!user) throw new HttpError('User not found.', 404);

  return { message: 'User deleted' };
};


//////////////////// Get Teacher Stat ////////////////////
const getTeacherStats = async (accessToken) => {
  const decoded = verifyToken(accessToken);
  if (decoded.role !== 'admin') throw new HttpError('Admin access required.', 403);

  const teachers = await User.find({ role: 'teacher' });
  const result = await Promise.all(teachers.map(async teacher => {
    const courses = await Course.find({ teacherId: teacher._id });
    let students = 0, revenue = 0, ratings = [];
    courses.forEach(course => {
      students += course.students?.length || 0;
      revenue += (course.price || 0) * (course.students?.length || 0);
      ratings.push(...(course.rating || []));
    });
    const avgRating = ratings.length ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2) : 'N/A';
    return {
      teacherId: teacher._id,
      name: `${teacher.firstName} ${teacher.lastName}`,
      phoneNumber: teacher.phoneNumber,
      email: teacher.email,
      joinedAt: teacher.createdAt,
      courseCount: courses.length,
      totalStudents: students,
      totalRevenue: revenue,
      avgRating
    };
  }));

  return { success: true, data: result };
};


////////////// GET LATEST ACTION ///////////
const getAdminLatestStats = async (accessToken) => {
  const decoded = verifyToken(accessToken);
  if (decoded.role !== 'admin') throw new HttpError('Admin access required.', 403);

  try {
    const [latestTeacher, latestStudent, latestShippedOrder] = await Promise.all([
      User.findOne({ role: 'teacher' }).sort({ createdAt: -1 }),
      User.findOne({ role: 'student' }).sort({ createdAt: -1 }),
      Order.findOne({ status: 'shipped' })
        .sort({ updatedAt: -1 })
        .populate({
          path: 'cartId',
          populate: {
            path: 'userId',
            select: 'firstName lastName phoneNumber createdAt'
          }
        })
    ]);

    const result = {
      latestTeacher: latestTeacher ? {
        id: latestTeacher._id,
        name: `${latestTeacher.firstName} ${latestTeacher.lastName}`,
        phoneNumber: latestTeacher.phoneNumber,
        createdAt: latestTeacher.createdAt
      } : null,

      latestStudent: latestStudent ? {
        id: latestStudent._id,
        name: `${latestStudent.firstName} ${latestStudent.lastName}`,
        phoneNumber: latestStudent.phoneNumber,
        createdAt: latestStudent.createdAt
      } : null,

      latestStoreBuyer: latestShippedOrder?.cartId?.userId ? {
        id: latestShippedOrder.cartId.userId._id,
        name: `${latestShippedOrder.cartId.userId.firstName} ${latestShippedOrder.cartId.userId.lastName}`,
        phoneNumber: latestShippedOrder.cartId.userId.phoneNumber,
        shippedAt: latestShippedOrder.updatedAt
      } : null
    };

    return { success: true, data: result };
  } catch (err) {
    throw new HttpError(err.message || 'Failed to load latest stats', 503);
  }
};




/////// GET COURSE DATA ////////////////////
const getAllCourseStats = async (accessToken) => {
  const decoded = verifyToken(accessToken);
  if (decoded.role !== 'admin') throw new HttpError('Admin access required.', 403);

  try {
    const courses = await Course.find()
      .populate('teacherId', 'firstName lastName')
      .populate('students.studentId', 'createdAt');

    const result = courses.map(course => {
      const totalStudents = course.students?.length || 0;
      const totalRevenue = totalStudents * (parseFloat(course.price) || 0);
      const ratings = course.rating || [];
      const avgRating = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2)
        : 'N/A';

      const latestStudent = course.students?.sort((a, b) => {
        return new Date(b.enrolledAt || b.createdAt) - new Date(a.enrolledAt || a.createdAt);
      })[0];

      return {
        courseId: course._id,
        name: course.name,
        level: course.level || 'N/A',
        teacher: course.teacherId ? `${course.teacherId.firstName} ${course.teacherId.lastName}` : 'N/A',
        totalRevenue,
        avgRating,
        totalStudents,
        latestUpdate: latestStudent?.enrolledAt || course.updatedAt || course.createdAt
      };
    });

    return { success: true, data: result };
  } catch (err) {
    throw new HttpError(err.message || 'Failed to load course stats', 503);
  }
};


//////// Get All Orders //////////////////////////////////////
const getAllOrders = async (accessToken) => {
  try {
    if (!accessToken) {
      return { success: false, status: 401, message: 'Access token is required' };
    }

    const decoded = verifyToken(accessToken);
    if (decoded.role !== 'admin') {
      return { success: false, status: 403, message: 'Admin access required' };
    }

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'cartId',
        populate: [
          {
            path: 'userId',
            select: 'name phoneNumber email role'
          },
          {
            path: 'items.productId',
            select: 'title price thumbnail'
          }
        ]
      });

    return {
      success: true,
      status: 200,
      data: orders
    };
  } catch (err) {
    console.error('[getAllOrdersForAdmin Error]', err);
    return { success: false, status: 503, message: err.message };
  }
};

module.exports = {
  adminLogin,
  createUser,
  getAdminDashboardStats,
  updateUser,
  deleteUser,
  getTeacherStats,
  getAdminLatestStats,
  getAllCourseStats,
  getAllOrders
};
