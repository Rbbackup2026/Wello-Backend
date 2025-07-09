const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        sparse: true // Allows multiple docs without email
    },
    mobile: {
        type: String,
        // unique: true,
        trim: true,
        sparse: true
    },
    password: {
        type: String,
        required: true
    },
    otp: {
        code: String,
        expiresAt: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Ensure either email or mobile is present
CustomerSchema.pre('validate', function (next) {
    if (!this.email && !this.mobile) {
        next(new Error('Either email or mobile must be provided.'));
    } else {
        next();
    }
});

module.exports = mongoose.model('Customer', CustomerSchema);
