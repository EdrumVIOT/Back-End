const User = require('../models/user-model');
const Course = require('../models/course-model');
const Product = require('../models/product-model');
const ProductPayment = require('../models/product-payment-model');
const HttpError = require('../middleware/http-error');
const { verifyToken } = require('../utils/verifyToken'); 


//////////// Admin Login /////////////////////////////////////
const adminLogin = async ({ phoneNumber, password }) => {
  if (!phoneNumber) {
    throw new HttpError('Phone number is required.', 400);
  }

  if (!password) {
    throw new HttpError('Password is required.', 400);
  }

  const user = await User.findOne({ phoneNumber });

  if (!user) {
    throw new HttpError('User not found.', 404);
  }

  if (!user.isVerified) {
    throw new HttpError('Account not verified. Please verify your phone number.', 401);
  }

  if (user.role == 'student') {
    throw new HttpError('Students are not allowed to log in.', 403);
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new HttpError('Invalid credentials.', 401);
  }

  user.lastLogin = Date.now();
  await user.save();

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  return {
    message: 'Login successful',
    accessToken,
    refreshToken,
  };
};


///////////////////////////////// Get User //////////////////////////////////////////////////////
const createUser = async (accessToken, userData) => {
  try {
    const decoded = verifyToken(accessToken);
    if ( decoded.role !== 'admin') {
      throw new HttpError('Unauthorized: Admin access required.', 403);
    }

    const { firstName, lastName, email, phoneNumber, password, role } = userData;

    if (!['teacher', 'store'].includes(role)) {
      throw new HttpError('Role must be either teacher or store.', 400);
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }]
    });
    if (existingUser) {
      throw new HttpError('Email or phone number already in use.', 400);
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role,
      isVerified: true
    });

    await newUser.save();

    return { message: 'User created successfully', user: newUser };
  } catch (err) {
    throw new HttpError(err.message || 'Error creating user.', 500);
  }
};


//////////////////// Get All Users /////////////////////////
const getAdminDashboardStats = async (accessToken) => {
  const response = {
    status: 'success',
    data: {
      totalUsers: 0,
      activeTeachers: 0,
      totalCourses: 0,
      totalProducts: 0,
      monthlyCourseRevenue: 0,
      monthlyShopRevenue: 0,
      totalRevenue: 0,
      monthlyGrowthRate: "N/A",
      shopGrowthRate: "N/A"
    },
    timestamp: new Date().toISOString()
  };

  if (!accessToken) {
    response.status = 'error';
    response.error = 'Missing access token';
    return response;
  }

  try {

    let decoded;
    try {
      decoded = verifyToken(accessToken);
      if (!decoded?.role || decoded.role !== 'admin') {
        throw new Error('Admin access required');
      }
    } catch (tokenError) {
      response.status = 'error';
      response.error = tokenError.message;
      return response;
    }


    let totalUsers = 0;
    let totalCourses = 0;
    let totalProducts = 0;
    let teachers = [];
    let courses = [];
    let paidPayments = [];

    try {
      [totalUsers, totalCourses, totalProducts, teachers, courses, paidPayments] = await Promise.all([
        User.countDocuments().catch(() => 0),
        Course.countDocuments().catch(() => 0),
        Product.countDocuments().catch(() => 0),
        User.find({ role: 'teacher' }).catch(() => []),
        Course.find().populate("students").catch(() => []),
        ProductPayment.find({ status: 'paid' }).populate({
          path: 'orderId',
          populate: { path: 'items.productId' }
        }).catch(() => [])
      ]);
    } catch (dbError) {
      console.error('Database error:', dbError);
      response.status = 'error';
      response.error = 'Failed to fetch data';
      return response;
    }


    response.data.totalUsers = totalUsers;
    response.data.totalCourses = totalCourses;
    response.data.totalProducts = totalProducts;

    if (teachers.length > 0 && courses.length > 0) {
      response.data.activeTeachers = teachers.filter(teacher =>
        courses.some(course => 
          course.teacherId?.toString() === teacher._id.toString()
        )
      ).length;
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    if (courses.length > 0) {
      let currentMonthCourseRevenue = 0;
      let lastMonthCourseRevenue = 0;

      for (const course of courses) {
        const price = parseFloat(course.price) || 0;
        const students = Array.isArray(course.students) ? course.students : [];

        for (const student of students) {
          try {
            const enrolledAt = new Date(
              student.enrolledAt || 
              course.createdAt || 
              now.toISOString()
            );

            if (enrolledAt >= currentMonthStart) {
              currentMonthCourseRevenue += price;
            } else if (enrolledAt >= lastMonthStart) {
              lastMonthCourseRevenue += price;
            }
          } catch (dateError) {
            console.error('Date parsing error:', dateError);
          }
        }
      }

      response.data.monthlyCourseRevenue = currentMonthCourseRevenue;
      
      if (lastMonthCourseRevenue > 0) {
        response.data.monthlyGrowthRate = (
          ((currentMonthCourseRevenue - lastMonthCourseRevenue) / lastMonthCourseRevenue) * 100
        ).toFixed(2);
      }
    }

    if (paidPayments.length > 0) {
      let currentMonthShopRevenue = 0;
      let lastMonthShopRevenue = 0;

      for (const payment of paidPayments) {
        try {
          const paidDate = new Date(payment.paidAt);
          if (!payment.orderId?.items) continue;

          const orderTotal = payment.orderId.items.reduce((sum, item) => {
            return sum + (parseFloat(item.productId?.price) || 0) * (item.quantity || 1);
          }, 0);

          if (paidDate >= currentMonthStart) {
            currentMonthShopRevenue += orderTotal;
          } else if (paidDate >= lastMonthStart) {
            lastMonthShopRevenue += orderTotal;
          }
        } catch (e) {
          console.error('Error processing payment:', e);
        }
      }

      response.data.monthlyShopRevenue = currentMonthShopRevenue;
      
      if (lastMonthShopRevenue > 0) {
        response.data.shopGrowthRate = (
          ((currentMonthShopRevenue - lastMonthShopRevenue) / lastMonthShopRevenue) * 100
        ).toFixed(2);
      }
    }
    response.data.totalRevenue = 
      response.data.monthlyCourseRevenue + 
      response.data.monthlyShopRevenue;

    return response;

  } catch (unexpectedError) {
    console.error('Unexpected error:', unexpectedError);
    return {
      status: 'error',
      error: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    };
  }
};

//////////////////  Update User //////////////////////////////////
const updateUser = async (accessToken, userId, updateData) => {
  try {
    if (!accessToken) {
      throw new HttpError('Access token is required.', 401);
    }
    if (!userId) {
      throw new HttpError('User ID is required.', 400);
    }
    if (!updateData || typeof updateData !== 'object') {
      throw new HttpError('Update data must be an object.', 400);
    }

    const decoded = verifyToken(accessToken);
    if (!decoded?.userId || decoded.role !== 'admin') {
      throw new HttpError('Unauthorized: Admin access required.', 403);
    }

    const user = await User.findOne({ userId });
    if (!user) {
      throw new HttpError('User not found.', 404);
    }

    const allowedRoles = ['teacher', 'store', 'admin'];

    if (updateData.firstName !== undefined) {
      if (typeof updateData.firstName !== 'string' || updateData.firstName.trim() === '') {
        throw new HttpError('Invalid firstName.', 400);
      }
      user.firstName = updateData.firstName.trim();
    }

    if (updateData.lastName !== undefined) {
      if (typeof updateData.lastName !== 'string' || updateData.lastName.trim() === '') {
        throw new HttpError('Invalid lastName.', 400);
      }
      user.lastName = updateData.lastName.trim();
    }

    if (updateData.email !== undefined) {
      if (typeof updateData.email !== 'string' || !updateData.email.includes('@')) {
        throw new HttpError('Invalid email.', 400);
      }
      user.email = updateData.email.toLowerCase();
    }

    if (updateData.phoneNumber !== undefined) {
      if (typeof updateData.phoneNumber !== 'string' || updateData.phoneNumber.trim() === '') {
        throw new HttpError('Invalid phoneNumber.', 400);
      }
      user.phoneNumber = updateData.phoneNumber.trim();
    }
    if (updateData.role !== undefined) {
      if (!allowedRoles.includes(updateData.role)) {
        throw new HttpError(`Role must be one of: ${allowedRoles.join(', ')}.`, 400);
      }
      user.role = updateData.role;
    }

    await user.save();

    return { message: 'User updated successfully', user };
  } catch (err) {
    if (err instanceof HttpError) {
      throw err;
    }
    throw new HttpError(err.message || 'Error updating user.', 500);
  }
};


////////////   Delete User ////////////////////////////////
const deleteUser = async (accessToken, userId) => {
  try {
    const decoded = verifyToken(accessToken);
    if (!decoded?.userId || decoded.role !== 'admin') {
      throw new HttpError('Unauthorized: Admin access required.', 403);
    }

    const user = await User.findOneAndDelete({ userId });
    if (!user) {
      throw new HttpError('User not found.', 404);
    }

    return { message: 'User deleted successfully' };
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      throw new HttpError('Invalid or expired access token.', 401);
    }
    throw new HttpError(err.message || 'Error deleting user.', 500);
  }
};

////////////// Get Teacher's All info /////////////////
const getTeacherStats = async (accessToken) => {
  try {
    const decoded = verifyToken(accessToken);
    if (!decoded?.userId || decoded.role !== 'admin') {
      throw new HttpError('Unauthorized: Admin access required.', 403);
    }

    const teachers = await User.find({ role: "teacher" });
    const result = [];

    for (const teacher of teachers) {
      const courses = await Course.find({ teacherId: teacher._id });

      const courseCount = courses.length;
      let totalStudents = 0;
      let totalRevenue = 0;
      let ratings = [];

      for (const course of courses) {
        totalStudents += course.students?.length || 0;
        totalRevenue += (course.price || 0) * (course.students?.length || 0);

        if (Array.isArray(course.rating)) {
          ratings.push(...course.rating);
        }
      }

      const avgRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          : null;

      result.push({
        teacherId: teacher._id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        phoneNumber: teacher.phoneNumber,
        email: teacher.email,
        joinedAt: teacher.createdAt,
        courseCount,
        totalStudents,
        totalRevenue,
        avgRating: avgRating?.toFixed(2) || "N/A",
      });
    }

    return { success: true, data: result };
    
  } catch (error) {
    console.error("Error fetching teacher stats:", error);
    return { success: false, message: error.message || "Server error" };
  }
};


module.exports = {
  createUser,
  getAdminDashboardStats,
  updateUser,
  deleteUser,
  adminLogin,
  getTeacherStats
};
