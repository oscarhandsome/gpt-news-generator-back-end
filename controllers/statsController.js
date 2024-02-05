const catchAsync = require('../utils/catchAsync');
// const News = require('./../models/newsModel');
// const Booking = require('./../models/bookingModel');
// const User = require('./../models/userModel');
// const AppError = require('../utils/appError');

exports.getInfo = catchAsync(async (req, res, next) => {
  // const news = await News.find();
  // const bookings = await Booking.find();
  // const users = await User.find();

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
