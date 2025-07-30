const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const productPaymentSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  method: {
    type: String,
    enum: ['qpay',  'bank_transfer'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paidAt: Date,
});

module.exports = model('ProductPayment', productPaymentSchema);
