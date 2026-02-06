const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.get('/health', authController.healthCheck);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/user', auth, authController.getUser);
router.put('/profile', auth, authController.updateProfile);

module.exports = router;
