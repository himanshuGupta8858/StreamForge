const { google } = require('googleapis');

/**
 * Gmail API Email Service
 *
 * Uses Google OAuth 2.0 to authenticate and send emails
 * via the Gmail API. Requires CLIENT_ID, CLIENT_SECRET,
 * REDIRECT_URI, and REFRESH_TOKEN environment variables.
 */

// Create OAuth2 client
const createOAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return oauth2Client;
};

/**
 * Build a MIME email message encoded in base64url format.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 * @returns {string} Base64url-encoded MIME message
 */
const createMimeMessage = (to, subject, htmlBody) => {
  const messageParts = [
    `From: ${process.env.GMAIL_USER}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody,
  ];

  const message = messageParts.join('\r\n');

  // Encode to base64url
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Send an email using the Gmail API.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 */
const sendEmail = async (to, subject, htmlBody) => {
  try {
    const oauth2Client = createOAuth2Client();

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const raw = createMimeMessage(to, subject, htmlBody);

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });

    console.log(`📧 Email sent to ${to} | Message ID: ${result.data.id}`);
    return result.data;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send a welcome email to a newly registered user.
 * @param {string} name - User's name
 * @param {string} email - User's email
 */
const sendWelcomeEmail = async (name, email) => {
  const subject = 'Welcome to Our Platform';

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f23;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f23; padding: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center;">
                  <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 16px; margin: 0 auto 20px; line-height: 60px; font-size: 28px;">
                    🚀
                  </div>
                  <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">
                    Welcome to Our Platform
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 20px 40px 40px;">
                  <p style="color: #b8c1ec; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Hello <strong style="color: #ffffff;">${name}</strong>,
                  </p>
                  <p style="color: #b8c1ec; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Your account has been successfully registered.
                  </p>
                  <p style="color: #b8c1ec; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                    Thank you for joining our platform. We're excited to have you on board!
                  </p>
                  
                  <!-- CTA Button -->
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2);">
                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" 
                           style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                          Go to Dashboard →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                  <p style="color: #6c7983; font-size: 13px; margin: 0;">
                    Best Regards,<br/>
                    <strong style="color: #b8c1ec;">The Team</strong>
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail(email, subject, htmlBody);
};

module.exports = { sendEmail, sendWelcomeEmail };
