const mongoose = require('mongoose');

const AdminOtpVerificationSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Admin',
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // auto-delete after 5 mins
  },
  verified: {
    type: Boolean,
    default: false,
  }
});

module.exports = mongoose.model('AdminOtpVerification', AdminOtpVerificationSchema);
