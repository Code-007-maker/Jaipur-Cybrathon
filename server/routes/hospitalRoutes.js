const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const auth = require('../middleware/auth');

router.get('/nearby', auth, hospitalController.getNearby);

module.exports = router;
