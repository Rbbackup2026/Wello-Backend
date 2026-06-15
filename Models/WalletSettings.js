const mongoose = require("mongoose");

const walletSettingsSchema = new mongoose.Schema(
  {
    earnType: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",
    },
    earnValue: { type: Number, default: 5 },
    coinValue: { type: Number, default: 1 },
    maxRedeemPercent: { type: Number, default: 50 },
    minOrderToEarn: { type: Number, default: 0 },
    minOrderToRedeem: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WalletSettings", walletSettingsSchema);
