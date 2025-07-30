const adminServices = require('../services/admin-services');



//////////// Admin Login ////////////////////////////
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
    const result = await adminServices.adminLogin(req.body);
    res.json(result); 
  } catch (err) {
    next(err);
  }
};

////////////////// Create User  /////////////////////////
const createNewUser = async (req, res, next) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Create new user'
    #swagger.description = 'Create a new user in the system'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer access token',
      example: 'Bearer your_access_token_here'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
          firstName: " ",
          lastName:  " ",
          phoneNumber:  " ",
          email:  " ",
          password: " ",
          role: " "
        },
      }
    }
  */
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token missing' });
    }

    const { firstName, lastName, phoneNumber, email, password, role } = req.body;
    if (!firstName || !lastName || !phoneNumber || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const result = await adminServices.createUser(token, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};


///////////////////  Get All Users ////////////////////////////////
const getAdminDashboardStats = async (req, res, next) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get all users'
    #swagger.description = 'Retrieve all users from the system'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      description: 'Bearer access token',
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...'
    }
  */
  try {
    console.log('[Admin Dashboard] Incoming request to get admin stats.');

    const authHeader = req.headers.authorization || '';
    console.log('[Auth Header]', authHeader);

    if (!authHeader.startsWith('Bearer ')) {
      console.error('[Auth Error] Malformed or missing token');
      return res.status(401).json({
        success: false,
        message: 'Access token missing or malformed',
      });
    }

    const accessToken = authHeader.split(' ')[1].trim();
    console.log('[Access Token]', accessToken);

    const result = await adminServices.getAdminDashboardStats(accessToken);

    console.log('[Dashboard Stats] Result:', result);

    res.status(200).json(result);
  } catch (err) {
    console.error('[Admin Dashboard Error]', err.message || err);
    next(err);
  }
};


//////////////////  Update User //////////////////////
const updateUserInfo = async (req, res, next) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Update user info'
    #swagger.description = 'Update user information in the system'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      description: 'Bearer access token with admin role',
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...'
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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token missing or malformed' });
    }

    const accessToken = authHeader.split(' ')[1].trim();

    const result = await adminServices.updateUser(accessToken, req.body);
    res.status(200).json(result); 
  } catch (err) {
    next(err); 
  }
};



///////////////// Delete User ////////////////////////
const deleteUserById = async (req, res, next) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Delete user'
    #swagger.description = 'Delete a user from the system'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        userId: "string"
      }
    }
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      description: 'Bearer access token',
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...'
    }
  */
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token missing or malformed' });
    }
    const accessToken = authHeader.split(' ')[1].trim();

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required in the request body' });
    }

    const result = await adminServices.deleteUser(accessToken, userId);
    res.status(200).json(result); 
  } catch (err) {
    next(err); 
  }
};


/////////////// Get Teacher Stats //////////////////////////////////////////
const getTeacherStats = async (req, res, next) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get all users'
    #swagger.description = 'Retrieve all users from the system'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      description: 'Bearer access token',
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...'
    }
  */
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token missing or malformed' });
    }

    const accessToken = authHeader.split(' ')[1].trim();

    const result = await adminServices.getTeacherStats(accessToken);
    res.status(200).json(result); 
  } catch (err) {
    next(err); 
  }
};


module.exports = {
  createNewUser,
  getAdminDashboardStats,
  updateUserInfo,
  deleteUserById,
  adminLogin,
  getTeacherStats
};
