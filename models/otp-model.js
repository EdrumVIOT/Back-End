const { Schema, model } = require("mongoose");

const otpSchema = new Schema({
  number: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, 
  },
});

module.exports = model("Otp", otpSchema);