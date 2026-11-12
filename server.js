const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🔥 MongoDB Connected Successfully!'))
    .catch((err) => console.error('Database Connection Error:', err));

// Nodemailer setup for sending official-style OTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, required: true },
    password: { type: String, required: true },
    otp: { type: String },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 1. Sign Up API: Save temp data & send Instagram/FB style OTP
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, age, password } = req.body;
        
        let user = await User.findOne({ email });
        if (user && user.isVerified) {
            return res.status(400).json({ success: false, message: "Email already registered! Please login." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        if (!user) {
            user = new User({ name, email, age, password, otp, isVerified: false });
        } else {
            user.otp = otp;
            user.name = name;
            user.age = age;
            user.password = password;
        }
        await user.save();

        // Official Branded Email Format (Instagram / FB Style)
        await transporter.sendMail({
            from: '"BaziGarr Security 🛡️" <' + process.env.EMAIL_USER + '>',
            to: email,
            subject: 'CyberSec Academy - Verification Code',
            text: `Hi ${name},\n\nYour verification code is: ${otp}\n\nWelcome to CyberSec Academy! Enter this code to verify your account. Valid for 10 minutes.\n\nRegards,\nBaziGarr`
        });

        res.status(200).json({ success: true, message: "OTP sent to your email successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to send OTP. Check email settings." });
    }
});

// 2. Verify OTP API
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP! Try again." });
        }

        user.isVerified = true;
        user.otp = undefined;
        await user.save();

        res.json({ success: true, message: "Account verified successfully! You can now login." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. Login API
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email or password!" });
        }
        if (!user.isVerified) {
            return res.status(400).json({ success: false, message: "Please verify your email with OTP first!" });
        }

        res.json({ success: true, message: "Login successful!", user: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
