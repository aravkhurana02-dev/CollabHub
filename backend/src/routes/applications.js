const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply to campaign
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { id: influencerId, profile_type } = req.user;

    if (profile_type !== 'influencer') {
      return res.status(403).json({ error: 'Only influencers can apply' });
    }

    // Check subscription (basic/pro can apply unlimited)
    const userResult = await pool.query('SELECT subscription_tier FROM users WHERE id = $1', [influencerId]);
    const user = userResult.rows[0];

    if (user.subscription_tier === 'free') {
      return res.status(403).json({ error: 'Upgrade to Basic tier to apply to campaigns' });
    }

    const { campaignId, coverLetter, proposedDeliverables, proposedFee } = req.body;

    const result = await pool.query(
      'INSERT INTO campaign_applications (campaign_id, influencer_id, cover_letter, proposed_deliverables, proposed_fee) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [campaignId, influencerId, coverLetter, proposedDeliverables, proposedFee]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Already applied to this campaign' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Get applications for campaign
router.get('/campaign/:campaignId', authMiddleware, async (req, res) => {
  try {
    const { id: userId, profile_type } = req.user;
    const { campaignId } = req.params;

    // Verify ownership
    const campaign = await pool.query('SELECT brand_id FROM campaigns WHERE id = $1', [campaignId]);
    if (campaign.rows[0].brand_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT ca.*, u.first_name, u.last_name, u.follower_count, u.engagement_rate FROM campaign_applications ca JOIN users u ON ca.influencer_id = u.id WHERE ca.campaign_id = $1 ORDER BY ca.created_at DESC',
      [campaignId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get influencer applications
router.get('/influencer/applications', authMiddleware, async (req, res) => {
  try {
    const { id: influencerId } = req.user;

    const result = await pool.query(
      'SELECT ca.*, c.title, c.budget_max FROM campaign_applications ca JOIN campaigns c ON ca.campaign_id = c.id WHERE ca.influencer_id = $1 ORDER BY ca.created_at DESC',
      [influencerId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept/Reject application
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { id: appId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify ownership
    const app = await pool.query(
      'SELECT ca.* FROM campaign_applications ca JOIN campaigns c ON ca.campaign_id = c.id WHERE ca.id = $1 AND c.brand_id = $2',
      [appId, userId]
    );

    if (app.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'UPDATE campaign_applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, appId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;