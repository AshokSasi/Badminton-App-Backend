const router = require('express').Router();
const SessionController = require('./controller');
const requireAuth = require('../middleware/auth.middleware');

router.get('/:sessionId/check-user', requireAuth, SessionController.checkUserInSession);
router.post('/:sessionId/join', requireAuth, SessionController.joinSession);
router.post('/:id/join', requireAuth, SessionController.joinSession);
router.post('/', requireAuth, SessionController.createSession);
router.patch('/:id/end', requireAuth, SessionController.updateSessionEndAt);
router.get('/:id/enrollment', requireAuth, SessionController.checkUserInSession);
router.get('/:id/players', requireAuth, SessionController.getSessionPlayers);
router.get('/:id/stats', requireAuth, SessionController.getSessionStats);
router.get('/:id/pair-stats', requireAuth, SessionController.getSessionPairStats);
router.delete('/:id/leave', requireAuth, SessionController.leaveSession);
module.exports = router;