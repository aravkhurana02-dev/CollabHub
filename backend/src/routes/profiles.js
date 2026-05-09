const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT id, email, first_name, last_name, profile_type, bio, profile_photo_url, website_url, follower_count, engagement_rate, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { firstName, lastName, bio, profilePhotoUrl, websiteUrl, socialHandles, followerCount, engagementRate } = req.body;

    const result = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, bio = $3, profile_photo_url = $4, website_url = $5, social_handles = $6, follower_count = $7, engagement_rate = $8 WHERE id = $9 RETURNING *',
      [firstName, lastName, bio, profilePhotoUrl, websiteUrl, JSON.stringify(socialHandles || {}), followerCount, engagementRate, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search influencers (for brands)
router.get('/search/influencers', async (req, res) => {
  try {
    const { category, minFollowers, minEngagement } = req.query;
    let query = 'SELECT id, first_name, last_name, bio, profile_photo_url, follower_count, engagement_rate FROM users WHERE profile_type = $1';
    const params = ['influencer'];

    if (minFollowers) {
      query += ` AND follower_count >= $${params.length + 1}`;
      params.push(parseInt(minFollowers));
    }

    if (minEngagement) {
      query += ` AND engagement_rate >= $${params.length + 1}`;
      params.push(parseFloat(minEngagement));
    }

    query += ' LIMIT 50';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;