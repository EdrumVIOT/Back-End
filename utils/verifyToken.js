const jwt = require('jsonwebtoken');

function verifyToken(accessToken) {
  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    return { userId: decoded.userId, role: decoded.role, id: decoded._id, error: null };
  } catch (error) {
    return { userId: null, error: 'Invalid or expired access token' };
  }
}

function verifyRefreshToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    return { userId: decoded.userId, role: decoded.role, id: decoded._id, error: null };
  } catch (error) {
    return { userId: null, error: 'Invalid or expired refresh token' };
  }
}

function verifyResetPasswordToken(resetToken) {
  try {
    const decoded = jwt.verify(resetToken, process.env.RESET_PASSWORD_TOKEN_SECRET);
    return { userId: decoded.userId, phoneNumber: decoded.phoneNumber, error: null };
  } catch (error) {
    return { userId: null, error: 'Invalid or expired reset password token' };
  }
}

module.exports = { verifyToken, verifyRefreshToken, verifyResetPasswordToken };
