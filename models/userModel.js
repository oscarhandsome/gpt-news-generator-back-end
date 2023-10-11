const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name'],
      // unique: false,
      trim: true,
      match: [
        new RegExp(/^[a-zA-Z\s]+$/),
        '{VALUE} is not valid. Please use only letters'
      ]
    },
    email: {
      type: String,
      default: '',
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    emailConfirmToken: String,
    emailConfirmed: {
      type: Boolean,
      default: false
    },
    emailConfirmTokenExpires: Date,
    photo: { type: String, default: 'https://i.pravatar.cc/100' },
    position: { type: String, default: 'Correspondent' },
    role: {
      type: String,
      enum: ['user', 'manager', 'admin'],
      default: 'user'
    },
    password: {
      type: String,
      required: [true, 'Please provide a passwod'],
      minLength: 8,
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your passwod'],
      validate: {
        // WORKS ONLY ON CREATE AND SAVE!!!
        validator: function(el) {
          return el === this.password;
        },
        message: 'Passwords are not the same!'
      }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
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

// return Id instead _id - not works
// userSchema.virtual(
//   'id'.get(function() {
//     return this._id.toHexString();
//   })
// );

userSchema.pre('save', async function(next) {
  // On;y run this function if password actually modified
  if (!this.isModified('password')) return next();

  // Hash the password coast of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.updatedAt = Date.now();
  next();
});

userSchema.pre(/^find/, function(next) {
  // this point to current query
  this.find({ isActive: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 10000;

  return resetToken;
};

userSchema.methods.createEmailConfirmToken = function() {
  const emailConfirmToken = crypto.randomBytes(32).toString('hex');

  this.emailConfirmToken = crypto
    .createHash('sha256')
    .update(emailConfirmToken)
    .digest('hex');

  this.emailConfirmTokenExpires =
    Date.now() +
    process.env.EMAIL_CONFIRM_TOKEN_EXPIRES_IN * 24 * 60 * 60 * 10000;

  return emailConfirmToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
