const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell plan name'],
    trim: true,
    match: [
      new RegExp(/^[a-zA-Z\s]+$/),
      '{VALUE} is not valid. Please use only letters'
    ]
  },
  price: {
    type: Number,
    default: 5,
    min: 5,
    max: 250,
    required: [true, 'Please provide price field!']
  },
  description: {
    type: String,
    default: '',
    required: [true, 'Please provide description field!']
  },
  allowedRequiests: {
    type: Number,
    default: 5,
    min: 5,
    max: 250,
    required: [true, 'Please provide allowed requiests field!']
  },
  features: {
    type: [String],
    default: [],
    required: [true, 'Please provide features field!']
  },
  isActive: {
    type: Boolean,
    default: true,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  updatedAt: {
    type: Date,
    default: Date.now()
  }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
