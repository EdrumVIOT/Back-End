const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phoneNumber: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['teacher', 'student','admin'], required: true, default: 'student' },
  score: { type: Number, default: 0 },
  lastLogin: { type: Date, default: null },
  userId: {
      type: Number,
      unique: true,
      required: true,
      default: () => Math.floor(Math.random() * 9000000) + 1000000
}
}, { timestamps: true });


UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});


UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, userId:this.userId ,email: this.email, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '10m' }
  );
};


UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id, userId:this.userId, email: this.email, role: this.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '1d' }
  );
};


UserSchema.methods.generateResetPasswordToken = function () {
  return jwt.sign(
    { id: this._id, userId: this.userId, phoneNumber: this.phoneNumber },
    process.env.RESET_PASSWORD_TOKEN_SECRET,
    { expiresIn: '2m' }
  );
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
