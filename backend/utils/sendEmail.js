import nodemailer from 'nodemailer';

/**
 * Send an email using the configured SMTP transporter.
 * Falls back to Ethereal (test email) if SMTP_HOST is not set.
 */
const sendEmail = async ({ to, subject, html }) => {
  let transporter;

  if (process.env.SMTP_HOST) {
    // Production SMTP (e.g. Gmail, SendGrid, university SMTP)
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development fallback: Ethereal fake SMTP
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"DBU-IMS System" <no-reply@dbu.edu.et>',
    to,
    subject,
    html
  });

  // Log preview URL in development
  if (!process.env.SMTP_HOST) {
    console.log(`[EMAIL] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }

  return info;
};

export default sendEmail;
