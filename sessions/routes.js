const router = require('express').Router();
const SessionController = require('./controller');

router.post('/', SessionController.createSession);

module.exports = router;