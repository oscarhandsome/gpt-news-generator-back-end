const express = require('express');
const commentController = require('./../controllers/commentController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

// POST /news/1232312/comments
// POST /comments

router.use(authController.protect);

router
  .route('/')
  .get(commentController.getAllComments)
  .post(
    // authController.protect,
    authController.restrictTo('user'),
    commentController.setNewsCommentIds,
    commentController.createComment
  );
router
  .route('/:id')
  .get(commentController.getComment)
  .patch(
    authController.restrictTo('user', 'admin'),
    commentController.updateComment
  )
  .delete(
    // authController.protect,
    authController.restrictTo('user', 'admin'),
    commentController.deleteComment
  );

module.exports = router;
