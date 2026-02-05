const { PushSubscription } = require('../common/models');
const { getVapidPublicKey } = require('../common/pushNotificationService');

/**
 * Get VAPID public key for client-side subscription
 */
exports.getPublicKey = async (req, res) => {
  try {
    const publicKey = getVapidPublicKey();
    res.status(200).json({
      success: true,
      publicKey
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'VAPID keys not configured. Please generate keys first.'
    });
  }
};

/**
 * Subscribe user to push notifications
 */
exports.subscribe = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription object. Required: endpoint, keys.p256dh, keys.auth'
      });
    }

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      where: { endpoint }
    });

    if (existingSubscription) {
      // Update user_id if it changed (e.g., different user on same device)
      if (existingSubscription.user_id !== userId) {
        existingSubscription.user_id = userId;
        existingSubscription.p256dh = keys.p256dh;
        existingSubscription.auth = keys.auth;
        await existingSubscription.save();
        
        return res.status(200).json({
          success: true,
          message: 'Push subscription updated successfully'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Push subscription already exists'
      });
    }

    // Create new subscription
    await PushSubscription.create({
      user_id: userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth
    });

    res.status(201).json({
      success: true,
      message: 'Push subscription created successfully'
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Unsubscribe user from push notifications
 */
exports.unsubscribe = async (req, res) => {
  try {
    const userId = req.userId;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Endpoint is required'
      });
    }

    const deleted = await PushSubscription.destroy({
      where: {
        user_id: userId,
        endpoint
      }
    });

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Push subscription removed successfully'
    });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user's subscriptions
 */
exports.getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.userId;

    const subscriptions = await PushSubscription.findAll({
      where: { user_id: userId },
      attributes: ['id', 'endpoint', 'created_at']
    });

    res.status(200).json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
