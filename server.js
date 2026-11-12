const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Serve static frontend files (HTML, CSS, JS) from the root directory
app.use(express.static(__dirname));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('🔥 MongoDB Connected Successfully!'))
    .catch((err) => console.error('Database Connection Error:', err));

// Route to serve the frontend homepage (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Example API test route
app.get('/api/status', (req, res) => {
    res.json({ message: "CyberSec Academy Backend is Live & Secure 🛡️" });
});

// Server Listening
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
