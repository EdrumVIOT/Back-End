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
}, { timestamps: true });

module.exports = model('Order', orderSchema);
