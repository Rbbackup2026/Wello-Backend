const mongoose = require("mongoose");

const loginSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: { type: String, required: true },
  confirmPassword: { type: String, required: true },
  name: { type: String },
  age:{type:Number},
  gender: { type: String },
  phone: { type: String },
  address: { type: String },
  savedAddresses: [{ type: String }], // मल्टीपल एड्रेस सेव करने के लिए
  otp: { type: String },
  otpExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
});

const usermodel = mongoose.model("Registeruser", loginSchema);
module.exports = usermodel;
