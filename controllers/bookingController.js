const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/subscriptionModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked plan
  const subscription = await Subscription.findById(req.params.subscriptionId);
  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    success_url: `http://localhost:3000/payment/success/?subscription=${
      req.params.subscriptionId
    }&user=${req.user.id}&price=${subscription.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/subscriptions`,
    customer_email: req.user.email,
    client_reference_id: req.params.subscriptionId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: subscription.price * 100,
          product_data: {
            name: `${subscription.name} subscription`,
            description: `${subscription.name} description`,
            // images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            images: [`https://random.imagecdn.app/400/400`]
          }
        }
      }
    ]
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { subscription, user, price } = req.body;

  if (!subscription && !user && !price) return next();
  const data = await Booking.create({ subscription, user, price });

  // next();
  // res.redirect(req.originalUrl.split['?'](0));
  res.status(200).json({
    status: 'success',
    data
  });
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
