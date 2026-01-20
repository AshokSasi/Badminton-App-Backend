const router = require('express').Router();
const AuthController = require('./controller');
router.post('/signup', AuthController.register);
router.get('/', AuthController.getAllUsers);
router.post('/login', AuthController.login);
module.exports = router;