const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const FROM = process.env.EMAIL_FROM ||
  '"Bay Area Accounting Solutions" <noreply@bayareaaccountingsolutions.com>';

async function sendMail({ to, subject, html }) {
  return transporter.sendMail({ from: FROM, to, subject, html });
}

module.exports = { sendMail };
