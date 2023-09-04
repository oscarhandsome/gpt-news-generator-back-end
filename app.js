const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet'); // Helmet helps secure Express apps by setting HTTP response headers.
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp'); // Express middleware to protect against HTTP Parameter Pollution attacks
const cors = require('cors'); // CORS is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const newsRouter = require('./routes/newsRoutes');
const userRouter = require('./routes/userRoutes');
const commentRouter = require('./routes/commentRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const subscriptionRouter = require('./routes/subscriptionRoutes');

const app = express();

// ENABLE CORS
app.use(cors());

// 1) GLOBAL MIDDLAWARES
// Set security HTTP headers
app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
  })
);

// Development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again in a hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.ody
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parametr pollution
app.use(hpp({ whitelist: ['type', 'ratingsAverage', 'ratingsQuantity'] }));

app.use((req, res, next) => {
  console.log('Hi from middleware');
  next();
});

// Serving static files
// app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  // console.log(req.cookies);
  next();
});

// 2) ROUTE HANDLERS

// app.get('/api/v1/news', getAllNews);
// app.post('/api/v1/news', createNews);
// app.get('/api/v1/news/:id', getNews);
// app.patch('/api/v1/news/:id', updateNews);
// app.delete('/api/v1/news/:id', deleteNews);

// 3) ROUTES
app.use('/api/v1/news', newsRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // next(err);
  next(new AppError(`Can't find ${req.originalUrl} on this server!`));
});

// app.use((err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message
//   });
// });
app.use(globalErrorHandler);

// 4) START SERVER
module.exports = app;
