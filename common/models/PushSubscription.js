const { DataTypes } = require('sequelize');

const PushSubscriptionModel = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  endpoint: { type: DataTypes.STRING, allowNull: false, unique: true },
  p256dh: { type: DataTypes.STRING, allowNull: false },
  auth: { type: DataTypes.STRING, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
};

module.exports = (sequelize) => sequelize.define('push_subscription', PushSubscriptionModel, {
  timestamps: false
});
