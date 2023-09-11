const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/subscriptionModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
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
    // success_url: `http://localhost:3000/payment/success/?subscription=${
    //   req.params.subscriptionId
    // }&user=${req.user.id}&price=${subscription.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-subscription`,
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

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { subscription, user, price } = req.body;

//   if (!subscription && !user && !price) return next();
//   const data = await Booking.create({ subscription, user, price });

//   // next();
//   // res.redirect(req.originalUrl.split['?'](0));
//   res.status(200).json({
//     status: 'success',
//     data
//   });
// });

const createBookingCheckout = async session => {
  const subscription = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].price_data.unit_amount / 100;
  await Booking.create({ subscription, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.header['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Weebhook error: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ recieved: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
