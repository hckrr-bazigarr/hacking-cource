const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('🔥 MongoDB Connected Successfully!'))
    .catch((err) => console.error('Database Connection Error:', err));

// Test Route
app.get('/', (req, res) => {
    res.json({ message: "CyberSec Academy Backend is Live & Secure 🛡️" });
});

// Server Listening
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
