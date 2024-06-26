const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('UNCAUGTH EXEPTION 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({
  path: './config.env'
});

const app = require('./app');
// console.log(process.env.PORT);

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(con => {
    // console.log(con.connections);
    console.log('DB Connected succesfull!');
  });

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  if (process.env.NODE_ENV === 'development')
    console.log(`Example app listening at http://localhost:${port}`);
  else console.log(`App listening at production`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM recived. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
