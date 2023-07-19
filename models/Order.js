const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
  customer: {
    type: String,
    required: true,
  },
  orderDate: {
    type: Date,
    required: true,
  },
  items: [
    {
      itemName: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      unitPrice: {
        type: Number,
        required: true,
      },
    },
  ],
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
