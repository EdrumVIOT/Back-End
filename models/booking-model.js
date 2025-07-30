const mongoose = require('mongoose');
const { Schema, model } = require("mongoose");

const bookingSchema = new Schema({
  meetingId: {
    type: Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  method: {
    type: String,
    enum: ['card', 'wallet', 'cash'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  paidAt: {
    type: Date,
  },
}, { timestamps: true });

module.exports = model("Booking", bookingSchema);
