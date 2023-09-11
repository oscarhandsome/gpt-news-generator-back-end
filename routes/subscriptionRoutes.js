const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.use(authController.protect);

router
  .route('/')
  .get(subscriptionController.getAllSubscriptions)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    subscriptionController.createSubscription
  );

router.get(
  '/my-subscription',
  // authController.protect,
  subscriptionController.getMySubscription
);

// router.use(
//   // authController.protect,
//   authController.restrictTo('admin')
// );
router
  .route('/:id')
  .get(subscriptionController.getSubscription)
  .patch(subscriptionController.updateSubscription)
  .delete(
    authController.restrictTo('admin'),
    subscriptionController.deleteSubscription
  );

module.exports = router;
