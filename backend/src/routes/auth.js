const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, profileType: user.profile_type },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, profileType } = req.body;

    // Validate input
    if (!email || !password || !profileType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['brand', 'influencer'].includes(profileType)) {
      return res.status(400).json({ error: 'Invalid profile type' });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, profile_type) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, profile_type',
      [email, passwordHash, firstName || '', lastName || '', profileType]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      user,
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profileType: user.profile_type,
        subscriptionTier: user.subscription_tier
      },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Google Sign-In
router.post('/google', async (req, res) => {
  try {
    const { idToken, profileType } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture, sub } = payload;

    // Find or create user
    let user = await pool.query('SELECT * FROM users WHERE google_sub = $1', [sub]);

    if (user.rows.length === 0) {
      const result = await pool.query(
        'INSERT INTO users (email, first_name, last_name, google_sub, profile_photo_url, profile_type, email_verified) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, profile_type',
        [email, given_name, family_name, sub, picture, profileType || 'influencer', true]
      );
      user = result;
    }

    const userData = user.rows[0];
    const token = generateToken(userData);

    res.json({
      user: userData,
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json(decoded);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ message: 'If email exists, a reset link has been sent' });
    }

    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3',
      [resetTokenHash, expiresAt, email]
    );

    res.json({ message: 'If email exists, a reset link has been sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE password_reset_expires > NOW()'
    );

    let user = null;
    for (const u of result.rows) {
      const valid = await bcrypt.compare(resetToken, u.password_reset_token);
      if (valid) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;