const { Schema, model } = require("mongoose");

const coursePaymentSchema = new Schema({
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
  method: String,
  paidAt: Date,
});

module.exports = model("CoursePayment", coursePaymentSchema);