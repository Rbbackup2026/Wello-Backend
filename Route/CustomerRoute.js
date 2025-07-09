const express = require('express');
const router = express.Router();
const Customer = require('../Models/Customers');
const sendOTPViaSMS = require('../SmsSender/SmsSender');

// Step 1: Register/Login with mobile and send OTP
router.post('/register-mobile', async (req, res) => {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
        return res.status(400).json({ error: 'Mobile and password are required' });
    }

    try {
        let customer = await Customer.findOne({ mobile });

        if (!customer) {
            customer = new Customer({ mobile, password });
        } else {
            customer.password = password; // update password on re-login if needed
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        customer.otp = { code: otpCode, expiresAt: otpExpires };
        await customer.save();

        await sendOTPViaSMS(mobile, otpCode);

        res.json({ message: 'OTP sent to mobile', customerId: customer._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Step 2: Verify Mobile OTP
router.post('/verify-mobile-otp', async (req, res) => {
    const { customerId, otp } = req.body;

    try {
        const customer = await Customer.findById(customerId);

        if (!customer || !customer.otp) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const isValid = customer.otp.code === otp && customer.otp.expiresAt > new Date();

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        customer.isVerified = true;
        customer.otp = undefined;
        await customer.save();

        res.json({ message: 'Mobile number verified successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
