const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path} ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  console.log('handleDuplicateFieldsDB', err);
  let value = err.errmsg
    ? err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/)
    : 'No value';
  if (err.keyValue) value = err.keyValue.name;

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => ({
    [el.name]: el.message
  }));

  // const message = `Invalid input data. ${errors.join('. ')}`;
  const message = `Invalid input data.`;
  return new AppError(message, 400, errors);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again!', 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  // if (req.originalUrl.startsWith('/api')) {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
  // }

  // B) Others
  // console.error('ERROR 💥', err);
  // res.status(err.statusCode).json({
  //   status: err.status,
  //   error: err,
  //   message: `Something went wrong! ${err.message}`,
  //   stack: err.stack
  // });
};

const sendErrorProd = (err, res) => {
  // A) API
  // if (req.originalUrl.startsWith('/api')) {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors
    });

    // Programming or other unknow error: don't leack error details
  } else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
  // }

  // B) RENDERED WEBSITE - (this part not available)
  // A) Operational, trusted error: send message to client
  // if (err.isOperational) {
  //   // isOperational, trusted error: send message to client
  //   return res.status(err.statusCode).json({
  //     status: err.status,
  //     message: err.message
  //   });
  // }
  // // B) Programing or other unknown error: don't leak error details
  // // 1. log error
  // console.error('ERROR 💥', err);
  // // 2. send generic
  // return res.status(500).json({
  //   status: 'error',
  //   message: ' Please try again later.'
  // });
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = {
      ...err,
      name: err.name
    };

    if (error.name === 'CastError') error = handleCastErrorDB(error); // error.kind === "ObjectID"
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error._message && error._message.includes('validation'))
      error = handleValidationErrorDB(error); // (error.name === "ValidationError")
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);

    sendErrorProd(error, res);
  }
};
