const nodemailer = require('nodemailer');

exports.sendPasswordReset = async ({ to, resetUrl }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Email service is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.');
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Reset your MCQ Master password',
    text: `Use this link to reset your password. It expires in 15 minutes: ${resetUrl}`,
  });
};
