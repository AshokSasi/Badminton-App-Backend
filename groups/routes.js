
const router = require('express').Router();
const GroupController = require('./controller');
const requireAuth = require('../middleware/auth.middleware');

router.get('/', requireAuth, GroupController.getAllGroups);
router.get('/:id', requireAuth, GroupController.getGroupById);
router.get('/:id/members', requireAuth, GroupController.getGroupMembers);
router.get('/:id/role', requireAuth, GroupController.getUserRoleInGroup);
// SESSIONS
router.get('/:group_id/sessions', requireAuth, GroupController.getSessionsByGroupId);

router.post('/', requireAuth, GroupController.createGroup);
router.post('/:id/join', requireAuth, GroupController.joinGroup);

router.post('/:id/request-join', requireAuth, GroupController.requestToJoinGroup);
router.post('/:id/update-join-request', requireAuth, GroupController.updateJoinRequestStatus);
router.get('/:id/membership-requests', requireAuth, GroupController.getGroupJoinRequests);
router.get('/user/join-requests', requireAuth, GroupController.getUserJoinRequests);
module.exports = router;