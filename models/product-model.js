const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const productSchema = new Schema({
  ownerId: {
    type: Number,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true },
  description: String,
  thumbnail: String, 
  images: [String], 
  category: String,
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model('Product', productSchema);
