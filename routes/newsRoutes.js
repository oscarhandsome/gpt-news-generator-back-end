const express = require('express');
const newsController = require('./../controllers/newsController');
const authController = require('./../controllers/authController');
// const commentController = require('./../controllers/commentController');
const commentRouter = require('./../routes/commentRoutes');

const router = express.Router();

// router.param('id', newsController.checkID);

// POST /news/1232312/comments
// GET /news/1232312/comments
// GET /news/1232312/comments/213231

// router
//   .route('/:newsId/comments')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     commentController.createComment
//   );

router.use('/:newsId/comments', commentRouter);

router
  .route('/top-5-best')
  .get(newsController.aliasBestNews, newsController.getAllNews);

router.route('/news-stats').get(newsController.getNewsStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'manager', 'user'),
    newsController.getMonthlyPlan
  );

router.route('/my-news').get(authController.protect, newsController.getMyNews);

router.route('/autor/:id').get(newsController.getNewsByAutorId);

router
  .route('/')
  .get(newsController.getAllNews)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'manager', 'user'),
    newsController.setUserCreatorId,
    newsController.checkSubscriptionAcceess,
    newsController.generateOpenAiLeapAi,
    newsController.createNews
  );
router
  .route('/:slug')
  .get(newsController.getNews)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    newsController.uploadNewsImages,
    newsController.resizeNewsImages,
    newsController.updateNews
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'manager'),
    newsController.deleteNews
  );

router
  .route('/:id/getImageResuts/:workflowRunId')
  .get(
    authController.protect,
    authController.restrictTo('user'),
    newsController.getResultsLeapAi,
    newsController.updateNews
  );

module.exports = router;
