const twilio = require('twilio');
require('dotenv').config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendOTPViaSMS = async (mobile, otp) => {
    return client.messages.create({
        body: `Your verification code is: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${mobile}` // Adjust for country code
    });
};

module.exports = sendOTPViaSMS;
