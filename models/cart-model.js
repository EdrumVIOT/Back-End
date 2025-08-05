const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const cartSchema = new Schema({
  userId: {
    type: Number,
    required: false,
  },
  items: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
        min: 1,
      },
    }
  ]
});

module.exports = model('Cart', cartSchema);
