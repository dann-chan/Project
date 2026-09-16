// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// 🧠 IN-MEMORY ATTEMPT TRACKER
// Structure: { "ip_address": { attempts: 0, lockoutUntil: timestamp } }
const loginAttempts = {};

const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

app.post('/api/verify-passcode', (req, res) => {
  const { passcode } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'; // Get user's IP address

  // 1. Initialize tracker for this IP if it doesn't exist
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { attempts: 0, lockoutUntil: null };
  }

  const record = loginAttempts[ip];
  const currentTime = Date.now();

  // 2. Check if the user is currently locked out
  if (record.lockoutUntil && currentTime < record.lockoutUntil) {
    const timeLeft = Math.ceil((record.lockoutUntil - currentTime) / 1000); // seconds left
    return res.status(429).json({ 
      success: false, 
      message: `Too many failed attempts. You are locked out. Try again in ${timeLeft} seconds.`,
      isLockedOut: true
    });
  }

  // 3. Verify the passcode
  if (passcode === process.env.CORRECT_PASSCODE) {
    // SUCCESS: Clear their failed record entirely
    loginAttempts[ip] = { attempts: 0, lockoutUntil: null };

    const token = jwt.sign({ unlocked: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ success: true, token });
  }

  // 4. FAILURE: Increment attempts
  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockoutUntil = currentTime + LOCKOUT_TIME;
    return res.status(429).json({
      success: false,
      message: `Too many failed attempts. You have been locked out for 5 minutes.`,
      isLockedOut: true
    });
  }

  // Standard wrong password message showing remaining tries
  const remaining = MAX_ATTEMPTS - record.attempts;
  return res.status(401).json({ 
    success: false, 
    message: `Incorrect passcode. You have ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.` 
  });
});

// Protected data route stays exactly the same
app.get('/api/protected-data', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Safe split reading

  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ secretContent: "✨ Secret Vault Content: You successfully bypassed the lock screen!" });
  } catch (err) {
    res.status(403).json({ error: 'Session expired. Please log in again.' });
  }
});

app.listen(PORT, () => console.log(`🚀 Server spinning on port ${PORT}`));
