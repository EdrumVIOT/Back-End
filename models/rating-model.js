const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");

const ratingSchema = new Schema({
  userId: {
    type: Number,
    ref: 'User',
    required: true,
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
  },
  rating: Number,
});

module.exports = model("Rating", ratingSchema);