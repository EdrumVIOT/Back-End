const adminServices = require('../services/admin-services');


///////////////////// Admin Login /////////////////////
const adminLogin = async (req, res, next) => {
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'User Login'
    #swagger.description = 'Login an existing user with phone number and password'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        phoneNumber: "string",
        password: "string"
      }
    }
  */
  try {
    console.log('[Admin Login] Incoming request:', req.body);

    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
      return res.status(400).json({ success: false, message: 'Phone number and password are required' });
    }

    const result = await adminServices.adminLogin(req.body);
    res.json(result);
  } catch (err) {
    console.error('[Admin Login Error]', err.message || err);
    next(err);
  }
};


///////////////////// Create User /////////////////////
const createNewUser = async (req, res, next) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Create new user'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      example: 'Bearer your_access_token_here'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        firstName: "string",
        lastName: "string",
        phoneNumber: "string",
        email: "string",
        password: "string",
        role: "string"
      }
    }
  */
  try {
    console.log('[Create User] Body:', req.body);

    const { firstName, lastName, phoneNumber, email, password, role } = req.body;
    if (!firstName || !lastName || !phoneNumber || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const result = await adminServices.createUser(req.headers.authorization, req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error('[Create User Error]', err.message || err);
    next(err);
  }
};


/////////////////// Get Admin Dashboard Stats /////////////////////
const getAdminDashboardStats = async (req, res, next) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get admin dashboard stats'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      example: 'Bearer your_access_token_here'
    }
  */
  try {
    console.log('[Admin Dashboard] Request Headers:', req.headers);
    const accessToken = req.headers.authorization?.split(' ')[1];
    const result = await adminServices.getAdminDashboardStats(accessToken);
    res.status(200).json(result);
  } catch (err) {
    console.error('[Dashboard Stats Error]', err.message || err);
    next(err);
  }
};


///////////// Get All Orders ///////////////////////////////
const getAllOrders = async (req, res, next) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get admin dashboard stats'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      example: 'Bearer your_access_token_here'
    }
  */
  try {
    console.log('[Admin Dashboard] Request Headers:', req.headers);
    const accessToken = req.headers.authorization?.split(' ')[1];
    const result = await adminServices.getAllOrders(accessToken);
    res.status(200).json(result);
  } catch (err) {
    console.error('[Dashboard Stats Error]', err.message || err);
    next(err);
  }
};


/////////////////// Update User /////////////////////
const updateUserInfo = async (req, res, next) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Update user info'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      example: 'Bearer your_access_token_here'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        userId: "string",
        firstName: "string",
        lastName: "string",
        phoneNumber: "string",
        email: "string",
        role: "string"
      }
    }
  */
  try {
    console.log('[Update User] Body:', req.body);

    if (!req.body.userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const result = await adminServices.updateUser(req.headers.authorization, req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error('[Update User Error]', err.message || err);
    next(err);
  }
};


/////////////////// Delete User /////////////////////
const deleteUserById = async (req, res, next) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Delete user'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      example: 'Bearer your_access_token_here'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        userId: "string"
      }
    }
  */
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const result = await adminServices.deleteUser(req.headers.authorization, userId);
    res.status(200).json(result);
  } catch (err) {
    console.error('[Delete User Error]', err.message || err);
    next(err);
  }
};


/////////////////// Get Teacher Stats /////////////////////
const getTeacherStats = async (req, res, next) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get teacher statistics'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      example: 'Bearer your_access_token_here'
    }
  */
  try {
    console.log('[Get Teacher Stats]');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token missing' });
    const result = await adminServices.getTeacherStats(token);
    res.status(200).json(result);
  } catch (err) {
    console.error('[Teacher Stats Error]', err.message || err);
    next(err);
  }
};


////////// GET LATEST ACTION /////////////////////
const getAdminLatestStats = async (req, res, next) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get dashboard statistics'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      example: 'Bearer your_access_token_here'
    }
  */
  try {
    console.log('[Get Latest Stats]');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token missing' });
    const result = await adminServices.getAdminLatestStats(token);
    res.status(200).json(result);
  } catch (err) {
    console.error('[Dashboard Stats Error]', err.message || err);
    next(err);
  }
};


///////// GET ALL COURSE STAT //////////////////////////
const getAllCourseStats = async (req, res, next) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get course statistics'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      example: 'Bearer your_access_token_here'
    }
  */
  try {
    console.log('[Get Course Stats]');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token missing' });
    const result = await adminServices.getAllCourseStats(token);
    res.status(200).json(result);
  } catch (err) {
    console.error('[Course Stats Error]', err.message || err);
    next(err);
  }
};

module.exports = {
  adminLogin,
  createNewUser,
  getAdminDashboardStats,
  updateUserInfo,
  deleteUserById,
  getTeacherStats,
  getAdminLatestStats,
  getAllCourseStats,
  getAllOrders
};
