const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    amount: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      default: "Pending",
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: "COD",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
