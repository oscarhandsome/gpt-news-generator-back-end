const History = require('./../models/historyModel');
const News = require('./../models/newsModel');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// const factory = require('./handlerFactory');

exports.getHistory = catchAsync(async (req, res, next) => {
  const doc = await History.findOne({ newsId: req.params.id });

  if (!doc) {
    return next(new AppError('No document found with that Slug', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    }
  });
});

exports.createHistory = catchAsync(async (req, res, next) => {
  const news = await News.findById(req.params.id);

  // if (!news) {
  //   return next(new AppError('No news found with that ID', 404));
  // }

  await History.findOneAndUpdate(
    { newsId: req.params.id },
    { $push: { history: news } },
    { upsert: true }
  );

  next();
});
