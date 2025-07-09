const mongoose = require("mongoose");

const loginSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: { type: String, required: true },
  confirmPassword: { type: String, required: true },
  // phone: { type: String, unique: true }, // now optional
});

const usermodel = mongoose.model("Registeruser", loginSchema);
module.exports = usermodel;
