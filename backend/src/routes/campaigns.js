const express = require('express');
const { pool } = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all campaigns (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, status, sort } = req.query;
    let query = 'SELECT * FROM campaigns WHERE status != $1';
    const params = ['cancelled'];

    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM campaigns WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create campaign (brands only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { id, profile_type } = req.user;

    if (profile_type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can create campaigns' });
    }

    // Check subscription (basic/pro can post unlimited)
    const userResult = await pool.query('SELECT subscription_tier FROM users WHERE id = $1', [id]);
    const user = userResult.rows[0];

    if (user.subscription_tier === 'free') {
      return res.status(403).json({ error: 'Upgrade to Basic tier to post campaigns' });
    }

    const {
      title,
      description,
      category,
      budgetMin,
      budgetMax,
      timelineStart,
      timelineEnd,
      requiredFollowers,
      requiredEngagementRate,
      deliverables,
      targetDemographics
    } = req.body;

    const result = await pool.query(
      'INSERT INTO campaigns (brand_id, title, description, category, budget_min, budget_max, timeline_start, timeline_end, required_followers, required_engagement_rate, deliverables, target_demographics) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [id, title, description, category, budgetMin, budgetMax, timelineStart, timelineEnd, requiredFollowers, requiredEngagementRate, deliverables, JSON.stringify(targetDemographics || {})]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update campaign (brand owner only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id: userId, profile_type } = req.user;
    const { id: campaignId } = req.params;

    if (profile_type !== 'brand') {
      return res.status(403).json({ error: 'Only brands can update campaigns' });
    }

    const campaign = await pool.query('SELECT brand_id FROM campaigns WHERE id = $1', [campaignId]);
    if (campaign.rows.length === 0 || campaign.rows[0].brand_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, description, status } = req.body;
    const result = await pool.query(
      'UPDATE campaigns SET title = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [title, description, status, campaignId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;