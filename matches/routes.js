const router = require('express').Router();
const MatchController = require('./controller');
const requireAuth = require('../middleware/auth.middleware');

// Generate a new match for a session
router.post('/generate', requireAuth, MatchController.generateMatch);

// End a match
router.post('/:id/end', requireAuth, MatchController.endMatch);

// Get all matches for a session
router.get('/session/:sessionId', requireAuth, MatchController.getSessionMatches);

// Get detailed match information
router.get('/:id/details', requireAuth, MatchController.getMatchDetails);

module.exports = router;