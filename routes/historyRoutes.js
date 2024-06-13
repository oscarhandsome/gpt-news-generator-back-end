const express = require('express');
const historyController = require('../controllers/historyController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.route('/:id').get(historyController.getHistory);

module.exports = router;
