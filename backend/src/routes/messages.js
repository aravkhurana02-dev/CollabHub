const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get conversations for user
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await pool.query(
      'SELECT c.*, u1.first_name as participant_1_name, u2.first_name as participant_2_name FROM conversations c JOIN users u1 ON c.participant_1_id = u1.id JOIN users u2 ON c.participant_2_id = u2.id WHERE participant_1_id = $1 OR participant_2_id = $1 ORDER BY updated_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get or create conversation
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { otherUserId, campaignId } = req.body;

    // Ensure consistent ordering
    const participant1 = Math.min(userId, otherUserId);
    const participant2 = Math.max(userId, otherUserId);

    let result = await pool.query(
      'SELECT * FROM conversations WHERE participant_1_id = $1 AND participant_2_id = $2',
      [participant1, participant2]
    );

    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO conversations (participant_1_id, participant_2_id, campaign_id) VALUES ($1, $2, $3) RETURNING *',
        [participant1, participant2, campaignId || null]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages in conversation
router.get('/conversations/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { id: userId } = req.user;

    // Verify access
    const conv = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND (participant_1_id = $2 OR participant_2_id = $2)',
      [conversationId, userId]
    );

    if (conv.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { conversationId, text } = req.body;

    // Verify access
    const conv = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND (participant_1_id = $2 OR participant_2_id = $2)',
      [conversationId, userId]
    );

    if (conv.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'INSERT INTO messages (conversation_id, sender_id, text_content) VALUES ($1, $2, $3) RETURNING *',
      [conversationId, userId, text]
    );

    // Update conversation last message
    await pool.query(
      'UPDATE conversations SET last_message_text = $1, last_message_at = NOW() WHERE id = $2',
      [text, conversationId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark messages as read
router.post('/mark-read', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.body;
    const { id: userId } = req.user;

    await pool.query(
      'UPDATE messages SET is_read = true, read_at = NOW() WHERE conversation_id = $1 AND sender_id != $2',
      [conversationId, userId]
    );

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;