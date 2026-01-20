const router = require('express').Router();
const GroupPlayerController = require('./controller');
const requireAuth = require('../middleware/auth.middleware');
// router.get('/', requireAuth, GroupPlayerController.getAllGroupPlayers);
router.get('/:id', requireAuth, GroupPlayerController.getAllGroupPlayers);
module.exports = router;