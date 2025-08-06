const User = require("../models/user-model");
const HttpError = require("../middleware/http-error");
const Otp = require('../models/otp-model');
const Cart = require('../models/cart-model')
const Comment = require('../models/comment-model');
const { sendMessage } = require("../utils/messageSender");
const { verifyToken, verifyRefreshToken, verifyResetPasswordToken } = require("../utils/verifyToken");

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// --------------------------- SIGNUP ---------------------------
const signupService = async ({ firstName, lastName, email, phoneNumber, password, role = 'student' }) => {
  if (!firstName || !lastName || !phoneNumber || !password) {
    throw new HttpError('All fields are required.', 422);
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { phoneNumber }] });

  if (existingUser) {
    if (existingUser.email === normalizedEmail) throw new HttpError('Email already in use.', 422);
    if (existingUser.phoneNumber === phoneNumber) throw new HttpError('Phone number already registered.', 422);
  }

  const userId = Math.floor(Math.random() * 9000000) + 1000000;
  const newUser = await User.create({
    firstName, lastName, email: normalizedEmail, phoneNumber, password,
    role, isVerified: false, score: 0, lastLogin: null, userId
  });

  const otp = generateOtp();
  await Otp.create({ number: phoneNumber, otp });

  const messageSent = await sendMessage(phoneNumber, otp);
  if (!messageSent) throw new HttpError('Failed to send OTP.', 503);

  return { message: 'Signup successful. OTP sent.' };
};

// --------------------------- HANDLE OTP (VERIFY / RESEND) ---------------------------
const handleSignupOtpService = async ({ phoneNumber, otp, action }) => {
  if (!phoneNumber) throw new HttpError('Phone number is required.', 422);
  const user = await User.findOne({ phoneNumber });
  if (!user) throw new HttpError('User not found.', 404);
  if (user.isVerified) throw new HttpError('User already verified.', 400);

  if (action === 'verify') {
    if (!otp) throw new HttpError('OTP is required.', 422);

    const otpRecord = await Otp.findOne({ number: phoneNumber, otp });
    if (!otpRecord) throw new HttpError('Invalid or expired OTP.', 403);

    const isExpired = Date.now() - new Date(otpRecord.createdAt).getTime() > 60_000;
    if (isExpired) {
      await Otp.deleteMany({ number: phoneNumber });
      throw new HttpError('OTP expired.', 403);
    }

    user.isVerified = true;
    await user.save();
    await Otp.deleteMany({ number: phoneNumber });

    return {
      message: 'Phone number verified.',
      accessToken: user.generateAccessToken(),
      refreshToken: user.generateRefreshToken(),
      user: user.toObject({ getters: true })
    };
  }

  if (action === 'resend') {
    const existingOtp = await Otp.findOne({ number: phoneNumber });
    if (existingOtp && Date.now() - new Date(existingOtp.createdAt).getTime() < 60_000) {
      throw new HttpError('Please wait before requesting a new OTP.', 429);
    }
    await Otp.deleteMany({ number: phoneNumber });

    const newOtp = generateOtp();
    await Otp.create({ number: phoneNumber, otp: newOtp });

    const messageSent = await sendMessage(phoneNumber, newOtp);
    if (!messageSent) throw new HttpError('Failed to send OTP.', 503);

    return { message: 'OTP resent successfully.' };
  }

  throw new HttpError('Invalid action type.', 400);
};

// /////////////////  LOGIN ////////////////////////////////////
const loginService = async ({ phoneNumber, password }) => {
  if (!phoneNumber || !password) throw new HttpError('Phone number and password required.', 422);

  const user = await User.findOne({ phoneNumber });
  if (!user) throw new HttpError('User not found.', 404);
  if (!user.isVerified) throw new HttpError('Account not verified.', 401);
  if (user.role !== 'student') throw new HttpError('Access denied.', 403);

  const isValid = await user.comparePassword(password);
  if (!isValid) throw new HttpError('Invalid credentials.', 401);

  user.lastLogin = Date.now();
  await user.save();

  return {
    message: 'Login successful',
    accessToken: user.generateAccessToken(),
    refreshToken: user.generateRefreshToken()
  };
};

// --------------------------- REFRESH TOKEN ---------------------------
const refreshAccessTokenService = async (refreshToken) => {
  if (!refreshToken) throw new HttpError('Refresh token required.', 401);

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) throw new HttpError('Invalid refresh token.', 403);

  const user = await User.findById(decoded.userId);
  if (!user) throw new HttpError('User not found.', 404);

  return {
    accessToken: user.generateAccessToken('10m'),
    refreshToken: user.generateRefreshToken()
  };
};

// --------------------------- GET USER DATA ---------------------------
const getUserDataService = async (accessToken) => {
  const decoded = verifyToken(accessToken);
  const userId = Number(decoded.userId);

  const user = await User.findOne({ userId }).select('-password');
  if (!user) throw new HttpError('User not found.', 404);

  const activeCart = await Cart.findOne({ userId, isOrdered: false });

  return {
    user: user.toObject({ getters: true }),
    cartId: activeCart ? activeCart._id.toString() : null,
  };
};


// --------------------------- REQUEST PASSWORD RESET ---------------------------
const requestResetService = async (phoneNumber) => {
  if (!phoneNumber) throw new HttpError('Phone number is required.', 422);

  const user = await User.findOne({ phoneNumber });
  if (!user) throw new HttpError('User not found.', 404);

  const existingOtp = await Otp.findOne({ number: phoneNumber });
  if (existingOtp && Date.now() - new Date(existingOtp.createdAt).getTime() < 30_000) {
    throw new HttpError('Please wait before requesting a new OTP.', 429);
  }
  await Otp.deleteMany({ number: phoneNumber });

  const otp = generateOtp();
  await Otp.create({ number: phoneNumber, otp });

  const messageSent = await sendMessage(phoneNumber, otp);
  if (!messageSent) throw new HttpError('Failed to send OTP.', 503);

  return { message: 'OTP sent for password reset.' };
};

// --------------------------- VERIFY/RESEND OTP FOR RESET ---------------------------
const verifyOrResendOtpService = async ({ phoneNumber, otp, action }) => {
  if (!phoneNumber || !action) throw new HttpError('Phone number and action are required.', 422);

  const user = await User.findOne({ phoneNumber });
  if (!user) throw new HttpError('User not found.', 404);

  if (action === 'verify') {
    if (!otp) throw new HttpError('OTP is required.', 422);

    const otpRecord = await Otp.findOne({ number: phoneNumber, otp });
    if (!otpRecord) throw new HttpError('Invalid or expired OTP.', 403);

    const isExpired = Date.now() - new Date(otpRecord.createdAt).getTime() > 60_000;
    if (isExpired) {
      await Otp.deleteMany({ number: phoneNumber });
      throw new HttpError('OTP expired.', 403);
    }

    const resetToken = user.generateResetPasswordToken();
    await Otp.deleteMany({ number: phoneNumber });

    return { message: 'OTP verified.', resetToken };
  }

  if (action === 'resend') {
    const existingOtp = await Otp.findOne({ number: phoneNumber });
    if (existingOtp && Date.now() - new Date(existingOtp.createdAt).getTime() < 60_000) {
      throw new HttpError('Please wait before requesting a new OTP.', 429);
    }
    await Otp.deleteMany({ number: phoneNumber });

    const newOtp = generateOtp();
    await Otp.create({ number: phoneNumber, otp: newOtp });

    const messageSent = await sendMessage(phoneNumber, newOtp);
    if (!messageSent) throw new HttpError('Failed to send OTP.', 503);

    return { message: 'OTP resent successfully.' };
  }

  throw new HttpError('Invalid action.', 400);
};

// --------------------------- RESET PASSWORD ---------------------------
const resetPasswordService = async (resetToken, newPassword) => {
  if (!resetToken || !newPassword) throw new HttpError('Reset token and new password are required.', 422);

  const decoded = verifyResetPasswordToken(resetToken);
  if (!decoded) throw new HttpError('Invalid or expired reset token.', 403);

  const user = await User.findOne({ phoneNumber: decoded.phoneNumber });
  if (!user) throw new HttpError('User not found.', 404);

  user.password = newPassword;
  await user.save();

  return { message: 'Password reset successful.' };
};

// --------------------------- CHANGE PASSWORD ---------------------------
const changeUserPasswordService = async (accessToken, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) throw new HttpError('Both current and new password are required.', 422);

  const decoded = verifyToken(accessToken);
  const user = await User.findById(decoded.id);
  if (!user) throw new HttpError('User not found.', 404);

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) throw new HttpError('Incorrect current password.', 401);

  user.password = newPassword;
  await user.save();

  return { message: 'Password changed successfully.' };
};

// --------------------------- WRITE COMMENT ---------------------------
const writeComment = async (accessToken, lessonId, content) => {
  if (!accessToken || !lessonId || !content) throw new HttpError('All fields are required.', 422);

  const decoded = verifyToken(accessToken);
  const userId = decoded.userId;

  const comment = await Comment.create({ lessonId, userId, content, parentId: null });
  return { success: true, data: comment };
};

// --------------------------- REPLY TO COMMENT ---------------------------
const replyToComment = async (accessToken, lessonId, parentId, content) => {
  if (!accessToken || !lessonId || !parentId || !content) throw new HttpError('All fields are required.', 422);

  const decoded = verifyToken(accessToken);
  const userId = decoded.userId;

  const parent = await Comment.findById(parentId);
  if (!parent) throw new HttpError('Parent comment not found.', 404);

  const reply = await Comment.create({ lessonId, userId, content, parentId });
  return { success: true, data: reply };
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
