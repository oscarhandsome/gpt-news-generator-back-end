const express = require('express');
const statsController = require('./../controllers/statsController');

const router = express.Router();

router.route('/info').get(statsController.getInfo);

module.exports = router;
