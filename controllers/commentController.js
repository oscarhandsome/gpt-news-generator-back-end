const Comment = require('./../models/commentModel');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// exports.getAllComments = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.newsId) filter = { news: req.params.newsId };

//   const comments = await Comment.find(filter);

//   res.status(200).json({
//     status: 'success',
//     length: comments.length,
//     data: {
//       comments
//     }
//   });
// });

exports.setNewsCommentIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.news) req.body.news = req.params.newsId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllComments = factory.getAll(Comment);
exports.getComment = factory.getOne(Comment);
exports.createComment = factory.createOne(Comment);
exports.updateComment = factory.updateOne(Comment);
exports.deleteComment = factory.deleteOne(Comment);
