const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
  '/checkout-session/:subscriptionId',
  authController.protect,
  bookingController.getCheckoutSession
);

router.post(
  '/checkout-payment',
  authController.protect,
  bookingController.createBookingCheckout
);

router.use(authController.protect);

module.exports = router;
