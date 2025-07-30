const userServices = require('../services/user-services');

//////////////////////  User Signup  ////////////////////////////////////////
const signup = async (req, res, next) => {
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'User Signup'
    #swagger.description = 'Create a new user account with first name, last name, email, phone number, and password'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "99119911",
        password: "securePassword123",
        role: "student"
      }
    }
  */
  try {
    const result = await userServices.signupService(req.body);
    res.status(201).json(result); 
  } catch (err) {
    next(err); 
  }
};


/////////////////   Handle Signup OTP: Verify or Resend ////////////////
const handleSignupOtp = async (req, res, next) => {
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Handle Signup OTP'
    #swagger.description = 'Verify or resend OTP for user signup'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        phoneNumber: "string",
        otp: "string",
        action: "string"
      }
    }
  */
  try {
    const result = await userServices.handleSignupOtpService(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

//////////////////////   User Login   ///////////////////////////////////
const login = async (req, res, next) => {
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
    const result = await userServices.loginService(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

///////////////////// Refresh Access Token ////////////////////////////////////
const refreshAccessToken = async (req, res, next) => {
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Refresh Access Token'
    #swagger.description = 'Refresh access token using a valid refresh token'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        refreshToken: "string"
      }
    }
  */
  try {
    const { refreshToken } = req.body;
    const result = await userServices.refreshAccessTokenService(refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
//////////////////////// Get User Data /////////////////////////////////////////////////////////////////
const getUserData = async (req, res, next) => {
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Get User Data'
    #swagger.description = 'Retrieve user data using the access token in the Authorization header'
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
    const result = await userServices.getUserDataService(accessToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
};


/////////////// Request OTP for Password Reset ///////////////////////////////////
const requestReset = async (req, res, next) => {
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Request OTP for Password Reset'
    #swagger.description = 'Request OTP for resetting password using phone number'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        phoneNumber: "string"
      }
    }
  */
  try {
    const { phoneNumber } = req.body;
    const result = await userServices.requestResetService(phoneNumber);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

///////////////// Verify or Resend OTP for Password Reset ////////////////
const verifyOrResendOtp = async (req, res, next) => {
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Verify or Resend OTP for Password Reset'
    #swagger.description = 'Verify or resend OTP to reset the password'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        phoneNumber: "string",
        otp: "string",
        action: "string"
      }
    }
  */
  try {
    const result = await userServices.verifyOrResendOtpService(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

///////////////// Reset Password ///////////////////////
const resetPassword = async (req, res, next) => {
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Reset Password'
    #swagger.description = 'Reset password using a valid reset token and new password'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      description: 'Bearer reset token',
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        newPassword: "string"
      }
    }
  */
  try {
    const authHeader = req.headers['authorization'];
    const resetToken = authHeader?.split(' ')[1]; 

    if (!resetToken) {
      throw new HttpError("Reset token is missing from Authorization header", 401);
    }

    const { newPassword } = req.body;
    const result = await userServices.resetPasswordService(resetToken, newPassword);

    res.json(result);
  } catch (err) {
    next(err);
  }
};


///////////////////////// Change User Password ///////////////////////
const changeUserPassword = async (req, res, next) => {
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Change User Password'
    #swagger.description = 'Change the current password of the user'
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
        currentPassword: "string",
        newPassword: "string"
      }
    }
  */
  try {
    const { currentPassword, newPassword } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token missing or malformed' });
    }

    const accessToken = authHeader.split(' ')[1].trim();
    const result = await userServices.changeUserPasswordService(accessToken, currentPassword, newPassword);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

////////////// Write Comment ////////////////////////////////
const writeComment = async (req, res, next) => {
  /*
    #swagger.tags = ['Comment']
    #swagger.summary = 'Write a new comment'
    #swagger.description = 'User writes a new top-level comment on a lesson.'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer accessToken'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        lessonId: " ",
        content: 'This is a great lesson!'
      }
    }
  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { lessonId , content } = req.body;

    const result = await writeComment(accessToken, lessonId, content);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/////////////////// Reply to a Comment /////////////////////
const replyToComment = async (req, res, next) => {
  /*
    #swagger.tags = ['Comment']
    #swagger.summary = 'Reply to a comment'
    #swagger.description = 'User replies to an existing comment under a lesson.'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer accessToken'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        lessonId: " ",
        parentId: " ",
        content: 'I agree with this!'
      }
    }
  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { lessonId, parentId , content} = req.body;

    const result = await replyToComment(accessToken, lessonId, parentId, content);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};




module.exports = {
  signup,
  handleSignupOtp,
  login,
  refreshAccessToken,
  getUserData,
  requestReset,
  verifyOrResendOtp,
  resetPassword,
  changeUserPassword,
  replyToComment,
  writeComment
};
