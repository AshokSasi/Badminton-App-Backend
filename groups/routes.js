const router = require('express').Router();
const GroupController = require('./controller');
const requireAuth = require('../middleware/auth.middleware');
router.get('/', requireAuth, GroupController.getAllGroups);
router.get('/:id', requireAuth, GroupController.getGroupById);
router.get('/:id/members', requireAuth, GroupController.getGroupMembers);
router.post('/', requireAuth, GroupController.createGroup);
//SESSIONS
router.get('/:group_id/sessions', requireAuth, GroupController.getSessionsByGroupId);

module.exports = router;