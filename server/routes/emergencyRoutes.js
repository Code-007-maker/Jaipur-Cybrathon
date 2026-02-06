const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const auth = require('../middleware/auth');

router.post('/', auth, emergencyController.createSOS);
router.get('/active', auth, emergencyController.getActiveSOS);
router.get('/history', auth, emergencyController.getHistory);
router.post('/cancel', auth, emergencyController.cancelSOS);
router.post('/resolve', auth, emergencyController.resolveSOS);

module.exports = router;
