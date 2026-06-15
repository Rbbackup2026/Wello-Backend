const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["credit", "debit"], required: true },
    coins: { type: Number, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

const userWalletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
    transactions: [walletTransactionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserWallet", userWalletSchema);
