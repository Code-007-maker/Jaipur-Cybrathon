const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const auth = require('../middleware/auth');

router.post('/', auth, emergencyController.createSOS);
router.get('/active', auth, emergencyController.getActiveSOS);
router.post('/cancel', auth, emergencyController.cancelSOS);

module.exports = router;
