const mongoose = require("mongoose");
const { Schema, model } = mongoose;


const lessonViewsSchema = new Schema({
  studentUserId: {
    type: Number,
    ref: 'User',
    required: true,
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
  },
  watchedAt: Date,
  progress: Number,
  completed: Boolean,
});

module.exports = model("LessonViews", lessonViewsSchema);