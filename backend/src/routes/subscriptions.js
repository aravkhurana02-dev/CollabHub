const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const router = express.Router();

// Get subscription info
router.get('/info', authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await pool.query(
      'SELECT subscription_tier, subscription_status, subscription_start_date, subscription_end_date FROM users WHERE id = $1',
      [userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create subscription
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { id: userId, email } = req.user;
    const { tier } = req.body; // 'basic' or 'pro'

    if (!['basic', 'pro'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const tierPrices = {
      basic: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_placeholder',
      pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder'
    };

    // Create or get Stripe customer
    let customer;
    const userResult = await pool.query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (user.stripe_customer_id) {
      customer = await stripe.customers.retrieve(user.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { userId }
      });
      await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customer.id, userId]);
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: tierPrices[tier] }]
    });

    // Update DB
    await pool.query(
      'UPDATE users SET subscription_tier = $1, subscription_status = $2, stripe_subscription_id = $3 WHERE id = $4',
      [tier, 'active', subscription.id, userId]
    );

    res.json({ subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel subscription
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;

    const userResult = await pool.query('SELECT stripe_subscription_id FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    const subscription = await stripe.subscriptions.del(user.stripe_subscription_id);

    await pool.query(
      'UPDATE users SET subscription_tier = $1, subscription_status = $2, stripe_subscription_id = NULL WHERE id = $3',
      ['free', 'cancelled', userId]
    );

    res.json({ message: 'Subscription cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;