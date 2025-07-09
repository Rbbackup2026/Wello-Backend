const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const AdminOtp = require('../models/AdminOtpVerification');
const Register = require('../models/Register'); // ✅ Admin model is Register

// ✅ Generate random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ✅ POST /api/admin/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { adminEmail } = req.body;

    const admin = await Register.findOne({ email: adminEmail });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTP for this admin
    await AdminOtp.deleteMany({ adminId: admin._id });

    // Save new OTP
    await AdminOtp.create({
      adminId: admin._id,
      otp: hashedOtp,
      expiresAt,
    });

    // TODO: Integrate email or SMS sending logic here
    console.log(`OTP for admin (${adminEmail}): ${otp}`);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ POST /api/admin/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { adminEmail, otp } = req.body;

    const admin = await Register.findOne({ email: adminEmail }); // ✅ Use Register instead of Admin
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const otpRecord = await AdminOtp.findOne({ adminId: admin._id });
    if (!otpRecord) return res.status(400).json({ message: 'OTP not found or expired' });

    if (otpRecord.expiresAt < Date.now()) {
      await AdminOtp.deleteOne({ _id: otpRecord._id }); // Optional: clean up expired OTP
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) return res.status(400).json({ message: 'Invalid OTP' });

    otpRecord.verified = true;
    await otpRecord.save();

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
