const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registeruser",
      required: true,
    },
    items: [
      {
        productId: {
          type: String, // Changed to String to support Slugs/Names
          required: true,
        },
        name: {
          type: String,
          default: "",
        },
        category: {
          type: String,
          default: "",
        },
        price: {
          type: Number,
          default: 0,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],

    // ✅ Patient Details
    prefix: {
      type: String,
      trim: true,
      default: "",
    },
    firstName: {
      type: String,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", ""],
      default: "",
      trim: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (value) => !value || /^\d+$/.test(value),
        message: "Mobile number must contain only numbers",
      },
    },
    dateOfBirth: {
      type: String,
      trim: true,
      default: "",
    },
    relation: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    area: {
      type: String,
      trim: true,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (value) => !value || /^\d{6}$/.test(value),
        message: "Pincode must be exactly 6 digits",
      },
    },

    // ✅ Appointment Slot
    slotDate: {
      type: String,
      required: true,
      trim: true,
    },
    slotTime: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ Amount Details
    amount: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
     // ✅ Wallet
    walletCoinsUsed: {
      type: Number,
      default: 0,
    },
    walletDiscount: {
      type: Number,
      default: 0,
    },

    // ✅ Order & Payment Status
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
      default: "Pending",
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: "COD",
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
