import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // true for port 465
  auth: {
    user: process.env.SMTP_USER || 'cybersecurit2026@gmail.com',
    pass: (process.env.SMTP_PASS || 'aoaxbfmarpprvjkx').replace(/\s+/g, ''),
  },
})

// Visual Premium HTML Template wrapper
function getHtmlTemplate(title, preheader, bodyContent, buttonHtml = '', footerDetails = '') {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #0b0b14;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #e2e8f0;
          -webkit-font-smoothing: antialiased;
        }
        .wrapper {
          width: 100%;
          table-layout: fixed;
          background-color: #0b0b14;
          padding: 40px 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #111122;
          border: 1px solid rgba(0, 224, 255, 0.15);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .header {
          background: linear-gradient(135deg, #111122 0%, #171730 100%);
          padding: 30px 40px;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #00e0ff;
          letter-spacing: 1px;
          margin-bottom: 5px;
          display: inline-block;
          border: 2px solid #00e0ff;
          padding: 4px 12px;
          border-radius: 6px;
          background: rgba(0, 224, 255, 0.05);
        }
        .subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-top: 8px;
        }
        .content {
          padding: 40px;
          line-height: 1.6;
        }
        .title {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          margin-top: 0;
          margin-bottom: 20px;
        }
        .text {
          font-size: 15px;
          color: #cbd5e1;
          margin-bottom: 30px;
        }
        .code-block {
          background: rgba(0, 224, 255, 0.06);
          border: 1px dashed rgba(0, 224, 255, 0.3);
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          font-family: 'Courier New', Courier, monospace;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 6px;
          color: #00e0ff;
          margin: 30px 0;
          text-shadow: 0 0 10px rgba(0, 224, 255, 0.2);
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #00e0ff 0%, #7c3aed 100%);
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 4px 15px rgba(0, 224, 255, 0.2);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .details-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
        }
        .detail-item {
          font-size: 13px;
          margin-bottom: 8px;
          color: #94a3b8;
        }
        .detail-item strong {
          color: #ffffff;
        }
        .footer {
          background-color: #0a0a14;
          padding: 30px 40px;
          text-align: center;
          font-size: 12px;
          color: #64748b;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
        }
        .footer a {
          color: #00e0ff;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="logo">ForensicAI</div>
            <div class="subtitle">Digital Forensics Intelligence</div>
          </div>
          <div class="content">
            <h1 class="title">${title}</h1>
            <div class="text">${bodyContent}</div>
            ${buttonHtml}
            ${footerDetails ? `<div class="details-box">${footerDetails}</div>` : ''}
          </div>
          <div class="footer">
            This is an automated system email from the ForensicAI Platform.<br>
            Please do not reply directly to this message.<br>
            <br>
            &copy; 2026 ForensicAI. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Sends a One-Time Password (OTP) code via email
 */
export async function sendOtpMail(email, otp) {
  const mailOptions = {
    from: `"ForensicAI Platform" <${process.env.SMTP_USER || 'cybersecurit2026@gmail.com'}>`,
    to: email,
    subject: `[ForensicAI] Email Verification Code: ${otp}`,
    html: getHtmlTemplate(
      'Verify Your Email Address',
      'Use this 6-digit OTP code to verify your identity and access your account.',
      `Welcome to ForensicAI. To secure your account, please enter the following verification code on the platform. This code is valid for 5 minutes.`,
      `<div class="code-block">${otp}</div>`
    ),
  }

  return transporter.sendMail(mailOptions)
}

/**
 * Sends an activity/incident alert email notification
 */
export async function sendNotificationMail(email, title, message, action, details) {
  let actionFormatted = action ? action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'System Action'
  
  const footerDetails = `
    <div class="detail-item"><strong>Activity:</strong> ${actionFormatted}</div>
    <div class="detail-item"><strong>Details:</strong> ${details || 'No additional details provided'}</div>
    <div class="detail-item"><strong>Timestamp:</strong> ${new Date().toUTCString()}</div>
  `

  const mailOptions = {
    from: `"ForensicAI Platform" <${process.env.SMTP_USER || 'cybersecurit2026@gmail.com'}>`,
    to: email,
    subject: `[ForensicAI Alert] ${title}`,
    html: getHtmlTemplate(
      title,
      message,
      message,
      '',
      footerDetails
    ),
  }

  return transporter.sendMail(mailOptions)
}
