const webPush = require('web-push');
const { PushSubscription, GroupPlayers } = require('../common/models');

// VAPID keys configuration
// Generate keys using: node scripts/generate-vapid-keys.js
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@badminton-app.com';

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
}

/**
 * Send push notification to a specific user
 * @param {number} userId - User ID to send notification to
 * @param {object} payload - Notification payload
 */
async function sendNotificationToUser(userId, payload) {
  try {
    const subscriptions = await PushSubscription.findAll({
      where: { user_id: userId }
    });

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          };

          await webPush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
          );
          
          return { success: true };
        } catch (error) {
          // If subscription is invalid/expired, delete it
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Removing expired subscription: ${subscription.endpoint}`);
            await subscription.destroy();
          }
          throw error;
        }
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Push notifications sent to user ${userId}: ${sent} successful, ${failed} failed`);
    return { sent, failed };
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Send push notification to all members of a group
 * @param {number} groupId - Group ID
 * @param {object} payload - Notification payload
 * @param {number} excludeUserId - Optional user ID to exclude from notifications
 */
async function sendNotificationToGroup(groupId, payload, excludeUserId = null) {
  try {
    const whereClause = { group_id: groupId };
    if (excludeUserId) {
      whereClause.player_id = { [require('sequelize').Op.ne]: excludeUserId };
    }

    const groupMembers = await GroupPlayers.findAll({
      where: whereClause,
      attributes: ['player_id']
    });

    if (groupMembers.length === 0) {
      console.log(`No members found in group ${groupId}`);
      return { totalSent: 0, totalFailed: 0, usersNotified: 0 };
    }

    const userIds = groupMembers.map(gp => gp.player_id);
    console.log(`Sending notifications to ${userIds.length} group members`);

    let totalSent = 0;
    let totalFailed = 0;

    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const result = await sendNotificationToUser(userId, payload);
          totalSent += result.sent;
          totalFailed += result.failed;
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error.message);
        }
      })
    );

    console.log(`Group notification complete: ${totalSent} sent, ${totalFailed} failed`);
    return { totalSent, totalFailed, usersNotified: userIds.length };
  } catch (error) {
    console.error(`Error sending notifications to group ${groupId}:`, error);
    throw error;
  }
}

/**
 * Get VAPID public key for client subscription
 */
function getVapidPublicKey() {
  if (!vapidPublicKey) {
    throw new Error('VAPID public key not configured');
  }
  return vapidPublicKey;
}

module.exports = {
  sendNotificationToUser,
  sendNotificationToGroup,
  getVapidPublicKey
};
