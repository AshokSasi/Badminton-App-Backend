const router = require('express').Router();
const AuthController = require('./controller');
router.post('/signup', AuthController.register);
router.get('/', AuthController.getAllUsers);
module.exports = router;