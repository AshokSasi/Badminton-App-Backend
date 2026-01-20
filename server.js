
const express = require('express');

const app = express();
const sequelize = require('./database/database');
const defineUser = require('./common/models/User');
const userRoutes = require('./players/routes');
const authRoutes = require('./authorization/routes');
const groupRoutes = require('./groups/routes');
const sessionRoutes = require('./sessions/routes');
const groupMembersRoutes = require('./group_players/routes');
app.use(express.json());
const cors = require('cors');
app.use(cors());
sequelize.sync().then(() => {
  console.log('Database synced');
}).catch((err) => {
  console.error('Error syncing database:', err);
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/groups', groupRoutes);
app.use('/sessions', sessionRoutes);
app.use('/group-members', groupMembersRoutes);
app.get('/status', (req, res) => {
  res.json({
    status: 'Running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));