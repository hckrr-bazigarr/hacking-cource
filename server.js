const express = require('express');
const mongoose = require('mongoose');
const { Resend } = require('resend');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected 🚀'))
    .catch(err => console.log('DB Error:', err));

// Resend Initialization
const resend = new Resend(process.env.RESEND_API_KEY);

// User Schema for OTP Auth
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    otp: String,
    otpExpires: Date,
    verified: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

// Send OTP Route
app.post('/api/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        await User.findOneAndUpdate(
            { email },
            { otp, otpExpires, verified: false },
            { upsert: true, new: true }
        );

        await resend.emails.send({
            from: 'CyberSec Academy <onboarding@resend.dev>',
            to: [email],
            subject: 'Your Verification OTP - CyberSec Academy',
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #0b0f19; color: #fff; border-radius: 8px;">
                <h2 style="color: #ff4d4d;">CyberSec Academy Verification</h2>
                <p>Your OTP code is:</p>
                <h1 style="background: #1a233a; padding: 10px 20px; display: inline-block; letter-spacing: 5px; color: #00ffcc;">${otp}</h1>
                <p>This code expires in 10 minutes.</p>
            </div>`
        });

        res.json({ success: true, message: 'OTP sent successfully!' });
    } catch (error) {
        console.error('OTP Send Error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP. Check email settings.' });
    }
});

// Verify OTP Route
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.otp !== otp || user.otpExpires < new Date()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.verified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Account verified successfully!' });
    } catch (error) {
        console.error('Verify Error:', error);
        res.status(500).json({ success: false, message: 'Server error during verification' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
