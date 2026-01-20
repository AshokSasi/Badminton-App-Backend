const router = require('express').Router();
const PlayerController = require('./controller');
const requireAuth = require('../middleware/auth.middleware');
router.get('/groups', requireAuth, PlayerController.getUserGroups);
module.exports = router;