const express = require('express');
const router = express.Router();
const triageController = require('../controllers/triageController');
const auth = require('../middleware/auth');

router.post('/analyze', auth, triageController.analyze);

module.exports = router;
