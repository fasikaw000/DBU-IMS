import nodemailer from 'nodemailer';

/**
 * Send an email using the configured SMTP transporter.
 * Falls back to Ethereal (test email) if SMTP_HOST is not set.
 */
const sendEmail = async ({ to, subject, html }) => {
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (!gmailUser || !gmailPass) {
    throw new Error('Gmail SMTP credentials are missing. Set GMAIL_USER and GMAIL_APP_PASSWORD.');
  }

  let transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
  } else {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || `"DBU-IMS System" <${gmailUser}>`,
    to,
    subject,
    html
  });

  return info;
};

export default sendEmail;
