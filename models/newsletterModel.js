const mongoose = require('mongoose');
const validator = require('validator');
// const User = require('./userModel');

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      default: '',
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false
    },
    createdAt: {
      type: Date,
      default: Date.now()
      // select: false
    },
    updatedAt: {
      type: Date,
      default: Date.now()
      // select: false
    }
  },
  {
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret._id; // return Id instead _id
        delete ret.__v;
      }
    },
    toObject: { virtuals: true }
    // versionKey: false
  }
);

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

module.exports = Newsletter;
