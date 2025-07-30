const { Schema, model } = require("mongoose");

const lessonSchema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  thumbnailUrl: String,
  videoUrl: String,
  duration: Number,
  views: Number,
  status: Boolean,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model("Lesson", lessonSchema);