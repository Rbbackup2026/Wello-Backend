const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;