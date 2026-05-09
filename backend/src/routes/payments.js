const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const router = express.Router();

// Create payment intent
router.post('/create-intent', authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { amount, campaignId } = req.body;

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: { userId, campaignId }
    });

    res.json({
      clientSecret: intent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook for payment status
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { userId, campaignId } = paymentIntent.metadata;

      await pool.query(
        'INSERT INTO payments (user_id, stripe_payment_id, amount, status, stripe_event_id) VALUES ($1, $2, $3, $4, $5)',
        [userId, paymentIntent.id, paymentIntent.amount / 100, 'succeeded', event.id]
      );
    }

    res.json({ received: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;