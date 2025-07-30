const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const meetingSchema = new Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true },   
  price: { type: Number, required: true },
  status: { type: String, default: 'available' }, 
});

module.exports = model('Meeting', meetingSchema);
