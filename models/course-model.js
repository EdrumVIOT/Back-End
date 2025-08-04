const { Schema, model } = require("mongoose");

const courseSchema = new Schema({
  teacherUserId: {
    type: Number,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  level: String,
  price: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model("Course", courseSchema);
