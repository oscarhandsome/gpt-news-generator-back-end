const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');

exports.getInfo = catchAsync(async (req, res, next) => {
  console.log(req);
  //   if (!news) {
  //     return next(new AppError('No news found with that ID', 404));
  //   }

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    // results: news.length,
    data: {
      // news
      news: '73M+',
      contributors: '1B+',
      organizations: '4M+'
    }
  });
});
