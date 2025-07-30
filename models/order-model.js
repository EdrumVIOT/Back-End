const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const orderSchema = new Schema({
  cartId: {
    type: Schema.Types.ObjectId,
    ref: 'Cart',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  }
}, { timestamps: true });

module.exports = model('Order', orderSchema);
