const User = require("../models/user-model");
const HttpError = require("../middleware/http-error");
const Otp = require('../models/otp-model');
const { sendMessage } = require("../utils/messageSender");
const { verifyToken, verifyRefreshToken, verifyResetPasswordToken } = require("../utils/verifyToken");


const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); 
};

///////////// User Signup  /////////////////////////////////////////////////////////////////////////////////////
const signupService = async ({ firstName, lastName, email, phoneNumber, password, role = 'student' }) => {
  if (!firstName || !lastName || !phoneNumber || !password) {
    throw new HttpError('All fields are required.', 400);
  }

  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { phoneNumber }],
  });

  if (existingUser) {
    if (existingUser.email === normalizedEmail) {
      throw new HttpError('Email is already taken.', 422);
    }
    if (existingUser.phoneNumber === phoneNumber) {
      throw new HttpError('Phone number is already registered.', 422);
    }
  }

  const userId = Math.floor(Math.random() * 9000000) + 1000000;

  const newUser = new User({
    firstName,
    lastName,
    email: normalizedEmail,
    phoneNumber,
    password,
    role,
    isVerified: false,
    score: 0,
    lastLogin: null,
    userId,
  });

  await newUser.save();

  const otp = generateOtp();

  await Otp.create({ number: phoneNumber, otp });

  const messageSent = await sendMessage(phoneNumber, otp);
  if (!messageSent) {
    throw new HttpError('Failed to send OTP.', 503);
  }

  return { message: 'Signup successful. OTP sent to phone.' };
};

///////////////// Handle Signup OTP //////////////////////////////////////////////
const handleSignupOtpService = async ({ phoneNumber, otp, action }) => {
  if (!phoneNumber) throw new HttpError('Phone number is required.', 400);

  const user = await User.findOne({ phoneNumber });
  if (!user) throw new HttpError('User not found.', 404);
  if (user.isVerified) throw new HttpError('User already verified.', 400);

  if (action === 'verify') {
    if (!otp) throw new HttpError('OTP is required for verification.', 400);

    const otpRecord = await Otp.findOne({ number: phoneNumber, otp });
    if (!otpRecord) throw new HttpError('Invalid or expired OTP.', 400);

    const isExpired = Date.now() - new Date(otpRecord.createdAt).getTime() > 60 * 1000;
    if (isExpired) {
      await Otp.deleteMany({ number: phoneNumber });
      throw new HttpError('OTP expired.', 400);
    }

    const updatedUser = await User.findOneAndUpdate(
      { phoneNumber },
      { isVerified: true },
      { new: true }
    );
    await Otp.deleteMany({ number: phoneNumber });

    const accessToken = updatedUser.generateAccessToken();
    const refreshToken = updatedUser.generateRefreshToken();

    return {
      message: 'Phone number verified successfully.',
      accessToken,
      refreshToken,
      user: updatedUser.toObject({ getters: true }),
    };
  }

  if (action === 'resend') {
    const existingOtp = await Otp.findOne({ number: phoneNumber });
    if (existingOtp) {
      const timeSinceLastOtp = Date.now() - new Date(existingOtp.createdAt).getTime();
      if (timeSinceLastOtp < 60 * 1000) {
        throw new HttpError('Please wait before requesting a new OTP.', 429);
      }
      await Otp.deleteMany({ number: phoneNumber });
    }

    const newOtp = generateOtp();
    await Otp.create({ number: phoneNumber, otp: newOtp });

    const messageSent = await sendMessage(phoneNumber, newOtp);
    if (!messageSent) throw new HttpError('Failed to send OTP.', 503);

    return { message: 'OTP resent successfully.' };
  }

  throw new HttpError('Invalid action type.', 400);
};

////////////////// User Login ////////////////////////////////////////////
const loginService = async ({ phoneNumber, password }) => {
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

  if (user.role !== 'student') {
    throw new HttpError('Only students are allowed to log in.', 403);
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


/////////////////////////REFRESH TOKEN  ////////////////////////////////////////////////
const refreshAccessTokenService = async (refreshToken) => {
  if (!refreshToken) throw new HttpError("Refresh token required.", 401);

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) throw new HttpError("Invalid refresh token.", 403);

  const user = await User.findById(decoded.userId);
  if (!user) throw new HttpError("User not found.", 404);
  
  const accessToken = user.generateAccessToken("10m");
  const newRefreshToken = user.generateRefreshToken();

  return { accessToken, refreshToken: newRefreshToken };
};

//////////////// GET USER BY ID   /////////////////////////////////////////////////////
const getUserDataService = async (accessToken) => {
  const decoded = verifyToken(accessToken);
  console.log("Decoded UserId:", decoded?.userId);

  const user = await User.findOne({ userId: Number(decoded.userId) }).select('-password');

  if (!user) throw new HttpError("User not found.", 404);

  return { user: user.toObject({ getters: true }) };
};


////////////////// Request reset OTP  ////////////////////////////////////////////////////
const requestResetService = async (phoneNumber) => {
  if (!phoneNumber) throw new HttpError("Phone number is required.", 400);

  const user = await User.findOne({ phoneNumber });
  if (!user) throw new HttpError("User not found.", 404);

  const existingOtp = await Otp.findOne({ number: phoneNumber });

  if (existingOtp) {
    const timeSinceLastOtp = Date.now() - new Date(existingOtp.createdAt).getTime();

    if (timeSinceLastOtp < 30 * 1000) {
      throw new HttpError("Please wait before requesting a new OTP.", 429);
    }

    await Otp.deleteMany({ number: phoneNumber });
  }

  const newOtp = generateOtp();

  await Otp.create({ number: phoneNumber, otp: newOtp });

  const messageSent = await sendMessage(phoneNumber, newOtp);
  if (!messageSent) {
    throw new HttpError("Failed to send OTP.", 503);
  }

  return { message: "OTP sent for password reset." };
};

//////////////////  Handle Verify/Resend OTP for Password Reset ////////////////////////
const verifyOrResendOtpService = async ({ phoneNumber, otp, action }) => {
  if (!phoneNumber) throw new HttpError("Phone number is required.", 400);
  if (!action) throw new HttpError("Action is required.", 400);

  const user = await User.findOne({ phoneNumber });
  if (!user) throw new HttpError("User not found.", 404);

  if (action === "verify") {
    if (!otp) throw new HttpError("OTP is required for verification.", 400);

    const otpRecord = await Otp.findOne({ number: phoneNumber, otp });
    if (!otpRecord) throw new HttpError("Invalid or expired OTP.", 400);

    const isExpired = Date.now() - new Date(otpRecord.createdAt).getTime() > 60 * 1000; 
    if (isExpired) {
      await Otp.deleteMany({ number: phoneNumber });
      throw new HttpError("OTP expired.", 400);
    }

    const resetToken = user.generateResetPasswordToken();
    await Otp.deleteMany({ number: phoneNumber });

    return { message: "OTP verified.", resetToken };
  }

  if (action === "resend") {
    const existingOtp = await Otp.findOne({ number: phoneNumber });
    if (existingOtp) {
      const timeSinceLastOtp = Date.now() - new Date(existingOtp.createdAt).getTime();
      if (timeSinceLastOtp < 60 * 1000) { 
        throw new HttpError("Please wait before requesting a new OTP.", 429);
      }

      await Otp.deleteMany({ number: phoneNumber });
    }

    const newOtp = generateOtp();
    await Otp.create({ number: phoneNumber, otp: newOtp });

    const messageSent = await sendMessage(phoneNumber, newOtp);
    if (!messageSent) throw new HttpError("Failed to send OTP.", 503);

    return { message: "OTP resent successfully." };
  }

  throw new HttpError("Invalid action.", 400);
};

///////////// RESET PASSWORD ////////////////////////////////////////////////
const resetPasswordService = async (resetToken, newPassword) => {
  if (!resetToken || !newPassword) {
    throw new HttpError("Reset token and new password are required.", 400);
  }

  const decodedToken = verifyResetPasswordToken(resetToken);
  if (!decodedToken) {
    throw new HttpError("Invalid or expired reset token.", 400);
  }

  const user = await User.findOne({ phoneNumber: decodedToken.phoneNumber });
  if (!user) {
    throw new HttpError("User not found.", 404);
  }

  user.password = newPassword; 
  await user.save();

  return { message: "Password updated successfully." };
};

///////////////////// Change User Password /////////////////////////////////////////////////////
const changeUserPasswordService = async (accessToken, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new HttpError("Current and new password are required.", 400);
  }

  const decoded = verifyToken(accessToken);
  if (!decoded?.userId) throw new HttpError("Invalid access token", 401);

  const user = await User.findById(decoded.id);
  if (!user) throw new HttpError("User not found.", 404);

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) throw new HttpError("Incorrect current password.", 401);

  user.password = newPassword;
  await user.save();

  return { message: "Password changed successfully." };
};

/////////// Write Comment //////////////////////////////////
const writeComment = async (accessToken, lessonId, content) => {
  try {
    if (!accessToken) throw new Error('Access token is required');
    if (!lessonId || !content) throw new Error('Lesson ID and content are required');

    const decoded = verifyToken(accessToken);
    const userId = decoded.userId;

    const comment = await Comment.create({
      lessonId,
      userId,
      content,
      parentId: null
    });

    return { success: true, data: comment };
  } catch (err) {
    console.error('[writeComment Error]', err);
    return { success: false, message: err.message };
  }
};

/////////////// Reply Comment //////////////////////////
const replyToComment = async (accessToken, lessonId, parentId, content) => {
  try {
    if (!accessToken) throw new Error('Access token is required');
    if (!lessonId || !parentId || !content) throw new Error('Lesson ID, parent ID, and content are required');

    const decoded = verifyToken(accessToken);
    const userId = decoded.userId;

    const parent = await Comment.findById(parentId);
    if (!parent) throw new Error('Parent comment not found');

    const reply = await Comment.create({
      lessonId,
      userId,
      content,
      parentId
    });

    return { success: true, data: reply };
  } catch (err) {
    console.error('[replyToComment Error]', err);
    return { success: false, message: err.message };
  }
};

module.exports = {
  signupService,
  handleSignupOtpService,
  loginService,
  refreshAccessTokenService,
  getUserDataService,
  requestResetService,
  verifyOrResendOtpService,
  resetPasswordService,
  changeUserPasswordService,
  writeComment,
  replyToComment,
};