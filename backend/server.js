// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// 🚨 CRITICAL: Enable if you are behind a reverse proxy (Heroku, Nginx, Cloudflare, etc.)
// Without this, req.ip will log the proxy's IP, locking out ALL users at once.
app.set('trust proxy', true); 

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// 🧠 IN-MEMORY ATTEMPT TRACKER
const loginAttempts = {};

const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 5 * 60 * 1000; // 5 minutes

app.post('/api/verify-passcode', (req, res) => {
  const { passcode } = req.body;
  
  // Use Express's built-in req.ip (safe when 'trust proxy' is configured)
  const ip = req.ip || 'unknown'; 

  // 1. Initialize tracker for this IP if it doesn't exist
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { attempts: 0, lockoutUntil: null };
  }

  const record = loginAttempts[ip];
  const currentTime = Date.now();

  // 2. Check if the user is currently locked out
  if (record.lockoutUntil && currentTime < record.lockoutUntil) {
    const timeLeft = Math.ceil((record.lockoutUntil - currentTime) / 1000);
    return res.status(429).json({ 
      success: false, 
      message: `Too many failed attempts. You are locked out. Try again in ${timeLeft} seconds.`,
      isLockedOut: true
    });
  }

  // Reset lockout if the time has passed but attempts weren't cleared
  if (record.lockoutUntil && currentTime >= record.lockoutUntil) {
    record.attempts = 0;
    record.lockoutUntil = null;
  }

  // 3. Verify the passcode
  if (passcode === process.env.CORRECT_PASSCODE) {
    // SUCCESS: Clear their failed record entirely
    delete loginAttempts[ip];

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

  // 5. Standard wrong password message showing remaining tries
  const attemptsLeft = MAX_ATTEMPTS - record.attempts;
  return res.status(401).json({
    success: false,
    message: `Incorrect passcode. You have ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} left.`,
    isLockedOut: false,
    attemptsLeft
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
