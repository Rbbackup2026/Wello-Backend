const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ["percentage", "flat"], required: true },
  discountValue: { type: Number, required: true },
  minAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },
  expiry: { type: Date, required: true },
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model("Coupon", couponSchema);
