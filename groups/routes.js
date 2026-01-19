const router = require('express').Router();
const GroupController = require('./controller');
router.get('/', GroupController.getAllGroups);
router.get('/:id', GroupController.getGroupById);
router.get('/:id/members', GroupController.getGroupMembers);
router.post('/', GroupController.createGroup);
//SESSIONS
router.get('/:group_id/sessions', GroupController.getSessionsByGroupId);

module.exports = router;