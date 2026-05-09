const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark as read
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id: notifId } = req.params;
    const { id: userId } = req.user;

    const result = await pool.query(
      'UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [notifId, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;