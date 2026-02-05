
const express = require('express');
require('dotenv').config();

const app = express();
const sequelize = require('./database/database');
const defineUser = require('./common/models/User');
const userRoutes = require('./players/routes');
const authRoutes = require('./authorization/routes');
const groupRoutes = require('./groups/routes');
const sessionRoutes = require('./sessions/routes');
const matchRoutes = require('./matches/routes');
const groupMembersRoutes = require('./group_players/routes');

// Load push notifications only if web-push is installed
let pushNotificationRoutes = null;
try {
  pushNotificationRoutes = require('./push_notifications/routes');
} catch (error) {
  console.log('Push notifications not available - install web-push to enable');
}

app.use(express.json());
const cors = require('cors');
app.use(cors());

console.log('Starting database sync...');
sequelize.sync({ force: false }).then(() => {
  console.log('✅ Database synced successfully');
}).catch((err) => {
  console.error('❌ Error syncing database:', err);
  console.error('Full error:', JSON.stringify(err, null, 2));
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/groups', groupRoutes);
app.use('/sessions', sessionRoutes);
app.use('/group-members', groupMembersRoutes);
app.use('/matches', matchRoutes);
if (pushNotificationRoutes) {
  app.use('/push-notifications', pushNotificationRoutes);
}
app.get('/status', (req, res) => {
  res.json({
    status: 'Running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//just a test comment