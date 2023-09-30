const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
// const sendEmail = require('./../utils/email');
const Email = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // secure connections
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  // if (req.secure || req.headers['x-forwarded-proto'] === 'https')
  //   cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

async function verify(token) {
  const client = new OAuth2Client(process.env.GOGGLE_CLIENT_ID_KEY);
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOGGLE_CLIENT_ID_KEY // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  // const userid = payload['sub'];
  // If request specified a G Suite domain:
  // const domain = payload['hd'];
  return payload;
}

// STEP 1 of REGISTRATION
exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  // const newUser = await User.create({
  const newUser = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
    // passwordChangedAt: req.body.passwordChangedAt,
    // passwordResetToken: req.body.passwordResetToken,
    // passwordResetExpires: req.body.passwordResetExpires,
    // role: req.body.role,
  });

  const emailConfirmToken = await newUser.createEmailConfirmToken();
  await newUser.save();

  // const url = `${req.protocol}://${req.get('host')}/me`;
  // await new Email(newUser, url).sendWelcome();
  const url = `${req.protocol}://${req.get(
    'host'
  )}/auth/email-confirm/${emailConfirmToken}`;
  await new Email(newUser, url).sendEmailConfirm();

  // createSendToken(newUser, 201, req, res);
  res.status(200).json({
    status: 'success',
    message: 'Confrim email sent to your email!'
  });
});

// STEP 2 CONFIRM EMAIL AFTER REGISTRATION
exports.emailConfirm = catchAsync(async (req, res, next) => {
  console.log('req.params', req.params);
  // 1) Get user based on user token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailConfirmToken: hashedToken,
    emailConfirmTokenExpires: {
      $gt: Date.now()
    }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(
      new AppError('Token of email confirmation is invalid or has expired', 400)
    );
  }
  user.emailConfirmed = true;
  user.emailConfirmToken = undefined;
  user.emailConfirmTokenExpires = undefined;
  await user.save({
    validateBeforeSave: false
  });

  // 3) Update passwordChangedAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check email and pass exist
  if (!email || !password) {
    next(new AppError('Please provide email and password', 400));
  }

  // 2) Check if user exist && password is correct
  const user = await User.findOne({
    email
  }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorect email or password', 401));
  }

  // 3) Check user confirmed email or not
  // if (!user.emailConfirmed) {
  //   return next(
  //     new AppError('Email not confirmed. Please confirm your email.', 403)
  //   );
  // }

  // 3) if everything okay, send token to client
  createSendToken(user, 201, req, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1) Gett token and check if it there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access!', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The token belonging to this token does not longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please login again.', 401)
    );
  }

  // GRANT Access to protected route
  // res.locals.user = currentUser;
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have permisson to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  // const resetURL = `${req.protocol}://${req.get(
  //   'host'
  // )}/api/v1/users/resetPassword/${resetToken}`;

  // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid 10 min)',
    //   message
    // });
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (error) {
    // console.log('error', error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on user token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 201, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // if (!user) {
  //   return next(new AppError('There is no user with email address', 404));
  // }
  // 2) Check if POSTed current password is correct
  if (
    !user ||
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(new AppError('Your current password is wrong!', 401));
  }

  // 3) If so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate() will NOT work as intended

  // 4) Log user in, send JWT
  createSendToken(user, 201, req, res);
});

exports.googleAuthSignup = catchAsync(async (req, res, next) => {
  if (req.body.token) {
    const user = await verify(req.body.token).catch(() => {
      return next(new AppError('Token is invalid or has expired', 401));
    });

    req.body.name = user.name;
    req.body.email = user.email;
    req.body.password =
      user.sub + user.jti + process.env.GOOGLE_SECRET_PASSWORD;
    req.body.passwordConfirm =
      user.sub + user.jti + process.env.GOOGLE_SECRET_PASSWORD;
    req.body.emailConfirmed = true;
    req.body.photo = user.picture;

    const newUser = await User.create(req.body);

    // const url = `${req.protocol}://${req.get('host')}/me`;
    const url = `https://gpt-chat-news-generator.netlify.app/me`;
    await new Email(newUser, url).sendWelcome();

    newUser.password = undefined;
    newUser.emailConfirmed = undefined;
    newUser.role = undefined;

    // TODO UPDATE OPTIONs
    res.cookie('jwt', { token: req.body.token });
    // createSendToken(newUser, 201, req, res);
    res.status(201).json({
      status: 'success',
      token: req.body.token,
      data: {
        user: newUser
      }
    });

    return;
  }

  next();
});

exports.googleAuthLogin = catchAsync(async (req, res, next) => {
  if (req.body.token) {
    const user = await verify(req.body.token).catch(() => {
      return next(new AppError('Token is invalid or has expired', 401));
    });

    req.body.email = user.email;
    req.body.password =
      user.sub + user.jti + process.env.GOOGLE_SECRET_PASSWORD;

    // 2) Check if user exist && password is correct
    const userDB = await User.findOne({
      email: user.email
    }).select('+password');

    userDB.password = undefined;

    // TODO UPDATE OPTIONs
    res.cookie('jwt', {
      token: req.body.token
    });
    // createSendToken(newUser, 201, req, res);
    res.status(201).json({
      status: 'success',
      token: req.body.token,
      data: {
        user: userDB
      }
    });
    return;
  }

  next();
});
