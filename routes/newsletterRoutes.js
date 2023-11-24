const express = require('express');
const newsletterController = require('./../controllers/newsletterController');
// const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

// router.use(authController.protect);

router
  .route('/')
  .get(newsletterController.getAllNewsletters)
  .post(
    // authController.protect,
    // authController.restrictTo('user'),
    // newsletterController.setNewsNewsletterIds,
    newsletterController.createNewsletter
  );
// router
//   .route('/:id')
//   .get(newsletterController.getNewsletter)
//   .patch(
//     // authController.restrictTo('user', 'admin'),
//     newsletterController.updateNewsletter
//   )
//   .delete(
//     // authController.protect,
//     // authController.restrictTo('user', 'admin'),
//     newsletterController.deleteNewsletter
//   );

module.exports = router;
