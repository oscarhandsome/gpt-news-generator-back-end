const Subscription = require('./../models/subscriptionModel');
const Booking = require('./../models/bookingModel');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.getSubscription = factory.getOne(Subscription);
exports.getAllSubscriptions = factory.getAll(Subscription);
exports.createSubscription = factory.createOne(Subscription);
exports.updateSubscription = factory.updateOne(Subscription);
exports.deleteSubscription = factory.deleteOne(Subscription);

exports.getMySubscription = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  // 2) Find subscriptions with returned IDs
  const subscriptionIds = bookings.map(el => el.subscription);
  const subscriptions = await Subscription.find({
    _id: { $in: subscriptionIds }
  });

  res.status(200).json({
    status: 'success',
    data: {
      data: subscriptions
    }
  });
});
