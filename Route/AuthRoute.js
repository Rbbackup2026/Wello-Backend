const express = require('express');
const router = express.Router();
const User = require('../Models/Register');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const isProfileComplete = (user) => {
  if (!user) return false;

  return Boolean(
    user.profileCompleted ||
    (user.name &&
      user.mobile &&
      user.age &&
      user.gender &&
      user.address)
  );
};

// ================= EMAIL CONFIG =================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Check email config
transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP Config Error:", error.message);
  } else {
    console.log("✅ Email Server is ready");
  }
});

// ================= REQUEST OTP =================
router.post('/request-otp', async (req, res) => {
  console.log("📢 REQUEST-OTP API HIT");

  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email zaroori hai." });
    }

    // ✅ Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Find existing user, otherwise create a new OTP-only user record
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const tempSecret = crypto.randomBytes(16).toString('hex');
      const hashedSecret = await bcrypt.hash(tempSecret, 10);

      user = await User.create({
        email: normalizedEmail,
        password: hashedSecret,
        confirmPassword: hashedSecret,
        profileCompleted: false,
        isVerified: false,
      });
    }

    // Save OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send Email
    await transporter.sendMail({
      from: `" Login" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`
    });

    console.log("📩 OTP sent:", otp, "→", normalizedEmail);

    return res.status(200).json({
      success: true,
      message: "OTP bhej diya gaya hai.",
      isNewUser: !isProfileComplete(user)
    });

  } catch (error) {
    console.error("❌ REQUEST OTP ERROR:", error.message);
    return res.status(500).json({
      success: false,
      message: "OTP send nahi ho paya"
    });
  }
});

// ================= VERIFY OTP =================
router.post('/verify-otp', async (req, res) => {
  console.log("📢 VERIFY-OTP API HIT");

  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email aur OTP required hai."
      });
    }

    // ✅ Normalize
    const normalizedEmail = email.toLowerCase().trim();
    const enteredOtp = String(otp).trim();

    const user = await User.findOne({ email: normalizedEmail });

    // Debug logs
    console.log("🔍 Email:", normalizedEmail);
    console.log("🔑 DB OTP:", user?.otp);
    console.log("⌨️ Entered OTP:", enteredOtp);
    console.log("⏳ Expiry:", user?.otpExpires);
    console.log("🕒 Current:", new Date());

    // ❌ User not found
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found"
      });
    }

    // ❌ OTP not requested
    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP request nahi kiya gaya"
      });
    }

    // ❌ Wrong OTP
    if (user.otp !== enteredOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // ❌ Expired OTP
    if (new Date() > user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP expire ho gaya hai"
      });
    }

    // ✅ SUCCESS
    console.log("✅ OTP VERIFIED SUCCESS");

    // Clear OTP after use
    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true;
    await user.save();

    // Get full user data without password for response
    const updatedUser = await User.findById(user._id).select('-password -confirmPassword');

    // Generate token for session
    const token = jwt.sign(
      { email: updatedUser.email, id: updatedUser._id },
      process.env.JWT_SECRET || "defaultSecretKey",
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "OTP Verified successfully",
      token: token,
      user: updatedUser,
      needsProfileUpdate: !isProfileComplete(updatedUser)
    });

  } catch (error) {
    console.error("❌ VERIFY OTP ERROR:", error.message);
    return res.status(500).json({
      success: false,
      message: "Verification error"
    });
  }
});

// ================= UPDATE PROFILE =================
router.post('/update-profile', async (req, res) => {
  try {
    const { email, name, mobileNo, age, gender, address } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const profileCompleted = Boolean(name && mobileNo && age && gender && address);

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { name, mobile: mobileNo, age, gender, address, profileCompleted },
      { new: true }
    ).select('-password -confirmPassword');

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ✅ GET SAVED ADDRESSES
// इसे फ्रंटएंड पर 'Saved Address Icon' के क्लिक पर कॉल करें
router.get('/get-saved-addresses/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('savedAddresses');
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ 
      success: true, 
      savedAddresses: user.savedAddresses || [] 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ✅ DELETE A SAVED ADDRESS
router.delete('/delete-saved-address/:userId', async (req, res) => {
  try {
    const { address } = req.body; // पेलोड में वो पता (string) भेजें जिसे डिलीट करना है
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $pull: { savedAddresses: address } },
      { new: true }
    ).select('savedAddresses');

    res.status(200).json({ success: true, message: "Address removed", savedAddresses: user.savedAddresses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

module.exports = router;
