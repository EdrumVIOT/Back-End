const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const courseEnrollmentSchema = new Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  studentUserId: {
    type: Number,
    ref: 'User',
    required: true,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  progress: Number,
  completed: Boolean,
  status: String,
  updatedAt: Date,
});

module.exports = model("CourseEnrollment", courseEnrollmentSchema);
