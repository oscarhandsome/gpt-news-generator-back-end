const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

// new Email(user, url).sendWelcome() - example on instance with method for welcome sending template

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Askhat Bagaviyev <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      this.from = process.env.SENDGRID_EMAIL_FROM;
      // Sendgrid
      // return nodemailer.createTransport({
      //   service: 'SendGrid',
      //   auth: {
      //     user: process.env.EMAIL_USERNAME,
      //     pass: process.env.EMAIL_PASSWORD
      //   }
      // });

      // SendingBlue / Brevo
      return nodemailer.createTransport({
        // host: "smtp-relay.brevo.com",
        // port: 587,
        // secure: false, // true for 465, false for other ports
        // host: process.env.SENDINBLUE_HOST,
        // port: process.env.SENDINBLUE_PORT,
        service: 'SendinBlue',
        auth: {
          user: process.env.SENDINGBLUE_USERNAME,
          pass: process.env.SENDINGBLUE_PASSWORD
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send actual email
  async send(template, subject) {
    // 1) Render HTML based on  pug Template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // 2) Define the email options
    const mailOptions = {
      from: 'Askhat Bagaviyev <admin-gpt-chat@gmail.com>',
      to: this.to,
      subject,
      text: htmlToText.convert(html)
      // html
    };

    // 3) Create a tranpsort and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to GPT news generator!');
  }

  async sendEmailConfirm() {
    await this.send(
      'emailConfirm',
      'Confirm your email at GPT news generator!'
    );
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid only 10 minutes)'
    );
  }
};

// const sendEmail = async options => {
//   // 1) Create a transporter
//   // const transporter = nodemailer.createTransport({
//   //   host: process.env.EMAIL_HOST,
//   //   port: process.env.EMAIL_PORT,
//   //   auth: {
//   //     user: process.env.EMAIL_USERNAME,
//   //     pass: process.env.EMAIL_PASSWORD
//   //   }
//   // });

//   // 2) Define the email options
//   const mailOptions = {
//     from: 'Askhat Bagaviyev <admin-gpt-chat@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message
//     // html:
//   };

//   // 3) Actually send the email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
