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
    console.error('[signup error]', err);
    res.status(422).json({ error: err.message });
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
    console.error('[handleSignupOtp error]', err);
    res.status(422).json({ error: err.message });
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
    console.error('[login error]', err);
    res.status(401).json({ error: err.message });
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
    console.error('[refreshAccessToken error]', err);
    res.status(403).json({ error: err.message });
  }
};


//////////////////////// Get User Data ////////////////////////////////
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
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token missing' });

    const result = await userServices.getUserDataService(token);
    res.json(result);
  } catch (err) {
    console.error('[getUserData error]', err);
    res.status(403).json({ error: err.message });
  }
};


/////////////// Request OTP for Password Reset ////////////////////////
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
    console.error('[requestReset error]', err);
    res.status(422).json({ error: err.message });
  }
};


///////////////// Verify or Resend OTP for Password Reset ////////////////////
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
    console.error('[verifyOrResendOtp error]', err);
    res.status(422).json({ error: err.message });
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
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Reset token missing' });

    const { newPassword } = req.body;
    const result = await userServices.resetPasswordService(token, newPassword);
    res.json(result);
  } catch (err) {
    console.error('[resetPassword error]', err);
    res.status(422).json({ error: err.message });
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
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token missing' });

    const { currentPassword, newPassword } = req.body;
    const result = await userServices.changeUserPasswordService(token, currentPassword, newPassword);
    res.json(result);
  } catch (err) {
    console.error('[changeUserPassword error]', err);
    res.status(422).json({ error: err.message });
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
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token missing' });

    const { lessonId, content } = req.body;
    const result = await userServices.writeComment(token, lessonId, content);
    res.status(201).json(result);
  } catch (err) {
    console.error('[writeComment error]', err);
    res.status(422).json({ error: err.message });
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
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token missing' });

    const { lessonId, parentId, content } = req.body;
    const result = await userServices.replyToComment(token, lessonId, parentId, content);
    res.status(201).json(result);
  } catch (err) {
    console.error('[replyToComment error]', err);
    res.status(422).json({ error: err.message });
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
  writeComment,
  replyToComment,
};
