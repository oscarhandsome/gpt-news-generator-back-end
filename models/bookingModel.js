const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  subscription: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subscription',
    required: [true, 'Booking must belong to a Subscription!']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!']
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  expiresAt: {
    type: Date,
    default: Date.now() + 30 * 24 * 60 * 60 * 1000 // +30 days
  },
  paid: {
    type: Boolean,
    default: true
  }
  // allowedRequests: {
  //   type: Number,
  //   default: 100
  //   // required: [true, 'Booking must have a quantity of requests']
  // }
});

bookingSchema.pre(/^find/, function(next) {
  this.populate('user').populate({
    path: 'subscription',
    select: 'name'
  });

  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
