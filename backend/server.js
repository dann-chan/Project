// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

app.set('trust proxy', true); 
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const loginAttempts = {};
const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 5 * 60 * 1000; 

// 🔐 MIDDLEWARE: Verify the JWT token before serving data
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
    req.user = user;
    next(); // Pass control to the next handler
  });
};

// 🔓 NEW PROTECTED ROUTE: Resolves your 404 error
app.get('/api/protected-data', authenticateToken, (req, res) => {
  // Replace this object with whatever content Danny's profile needs
  return res.json({
    success: true,
    secretContent: {
      bio: "Welcome to Danny's private profile!",
      email: "danny@example.com",
      privateNote: "This data is securely pulled from the backend using a valid JWT."
    }
  });
});

// POST: Verify passcode route
app.post('/api/verify-passcode', (req, res) => {
  const { passcode } = req.body;
  const ip = req.ip || 'unknown'; 

  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { attempts: 0, lockoutUntil: null };
  }

  const record = loginAttempts[ip];
  const currentTime = Date.now();

  if (record.lockoutUntil && currentTime < record.lockoutUntil) {
    const timeLeft = Math.ceil((record.lockoutUntil - currentTime) / 1000);
    return res.status(429).json({ 
      success: false, 
      message: `Too many failed attempts. You are locked out. Try again in ${timeLeft} seconds.`,
      isLockedOut: true
    });
  }

  if (record.lockoutUntil && currentTime >= record.lockoutUntil) {
    record.attempts = 0;
    record.lockoutUntil = null;
  }

  if (passcode === process.env.CORRECT_PASSCODE) {
    delete loginAttempts[ip];
    const token = jwt.sign({ unlocked: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ success: true, token });
  }

  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockoutUntil = currentTime + LOCKOUT_TIME;
    return res.status(429).json({
      success: false,
      message: `Too many failed attempts. You have been locked out for 5 minutes.`,
      isLockedOut: true
    });
  }

  const attemptsLeft = MAX_ATTEMPTS - record.attempts;
  return res.status(401).json({
    success: false,
    message: `Incorrect passcode. You have ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} left.`,
    isLockedOut: false,
    attemptsLeft
  });
});

// App listener setup
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
