const router = require('express').Router();
const SessionController = require('./controller');
const requireAuth = require('../middleware/auth.middleware');

router.post('/:sessionId/join', requireAuth, SessionController.joinSession);
router.post('/', requireAuth, SessionController.createSession);
router.patch('/:id/end', requireAuth, SessionController.updateSessionEndAt);
module.exports = router;