const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get VAPID public key (public endpoint)
router.get('/public-key', controller.getPublicKey);

// Subscribe to push notifications (requires authentication)
router.post('/subscribe', authMiddleware, controller.subscribe);

// Unsubscribe from push notifications (requires authentication)
router.post('/unsubscribe', authMiddleware, controller.unsubscribe);

// Get user's subscriptions (requires authentication)
router.get('/subscriptions', authMiddleware, controller.getUserSubscriptions);

module.exports = router;
