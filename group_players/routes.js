const router = require('express').Router();
const GroupPlayerController = require('./controller');
// router.get('/', GroupPlayerController.getAllGroupPlayers);
router.get('/:id', GroupPlayerController.getAllGroupPlayers);
module.exports = router;