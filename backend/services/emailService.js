const sgMail = require("@sendgrid/mail");

/**
 * Email service for sending follow-up digest emails with SMS deep links
 * Using SendGrid API for reliable email delivery
 */

// Initialize SendGrid with API key
let isConfigured = false;

function initializeSendGrid() {
  if (!isConfigured && process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    isConfigured = true;
  }
  return isConfigured;
}

/**
 * Format phone number to E.164 format for SMS links
 * @param {string} phoneNumber - Raw phone number from database
 * @returns {string} - Formatted phone number (e.g., +15551234567)
 */
function formatPhoneForSMS(phoneNumber) {
  if (!phoneNumber) return "";

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "");

  // Add +1 for US numbers if missing
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+${digits}`;
  }

  // Return with + prefix
  return `+${digits}`;
}

/**
 * Create SMS deep link with URL-encoded message body
 * @param {string} phoneNumber - Customer phone number
 * @param {string} messageBody - Follow-up message text
 * @returns {string} - SMS deep link URL
 */
function formatSMSLink(phoneNumber, messageBody) {
  const formattedPhone = formatPhoneForSMS(phoneNumber);
  const encodedBody = encodeURIComponent(messageBody);
  // iOS format uses & separator (not ?)
  // sms:+15551234567&body=message
  return `sms:${formattedPhone}&body=${encodedBody}`;
}

/**
 * Generate HTML email template for daily digest
 * @param {string} userName - User's first name
 * @param {Array} followups - Array of follow-up objects
 * @param {Date} date - Date for the digest
 * @returns {string} - HTML email content
 */
function generateEmailHTML(userName, followups, date) {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const followupsHTML = followups
    .map((f) => {
      const smsLink = formatSMSLink(f.customerPhone, f.messageBody);
      const displayPhone = f.customerPhone || "No phone number";
      const telLink = f.customerPhone
        ? `tel:${formatPhoneForSMS(f.customerPhone)}`
        : "#";

      // Debug logging
      console.log(`SMS Link generated: ${smsLink}`);
      console.log(`Customer: ${f.customerName}, Phone: ${f.customerPhone}`);

      return `
      <div style="margin: 20px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
        <h3 style="margin: 0 0 10px 0; color: #333;">${f.customerName}</h3>
        <p style="margin: 5px 0; color: #666;">
          <strong>📞 Phone:</strong> <a href="${telLink}" style="color: #007bff; text-decoration: none;">${displayPhone}</a>
        </p>
        <div style="margin: 15px 0; padding: 15px; background-color: white; border-left: 3px solid #007bff; border-radius: 4px;">
          <p style="margin: 0 0 5px 0; font-size: 12px; color: #666; font-weight: bold;">Message to send:</p>
          <p style="margin: 0; font-style: italic; color: #333;">
            ${f.messageBody}
          </p>
        </div>
        ${
          f.customerPhone
            ? `
          <div style="margin: 15px 0 0 0;">
            <a href="${smsLink}" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-bottom: 10px;">
              📱 Open in SMS App
            </a>
            <p style="margin: 10px 0 0 0; padding: 10px; background-color: #fff3cd; border-left: 3px solid #ffc107; font-size: 13px; color: #856404; border-radius: 4px;">
              <strong>💡 If button doesn't work:</strong><br/>
              1. Tap the phone number above to call or open your SMS app<br/>
              2. Copy and paste the message text above
            </p>
          </div>
        `
            : `
          <p style="color: #dc3545; font-size: 14px;">
            ⚠️ No phone number available for this customer
          </p>
        `
        }
      </div>
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Follow-Ups for Today</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0;">📅 Your Follow-Ups for Today</h1>
      </div>
      
      <div style="padding: 20px; background-color: white; border: 1px solid #e0e0e0; border-top: none;">
        <p style="font-size: 16px; margin-top: 0;">Hi <strong>${userName}</strong>,</p>
        <p style="font-size: 16px;">You have <strong>${followups.length}</strong> follow-up${followups.length !== 1 ? "s" : ""} scheduled for <strong>${dateStr}</strong>:</p>
        
        ${followupsHTML}
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
        
        <p style="font-size: 14px; color: #666; margin-bottom: 5px;">
          <strong>💡 Tip:</strong> On your mobile device, tap the "Open in SMS App" button to pre-fill the message in your SMS app. Review and tap send!
        </p>
        
        <p style="font-size: 12px; color: #999; margin-top: 20px;">
          You're receiving this email because you have follow-ups scheduled in FollowUps CRM. 
          You can change your email preferences in Settings.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send daily digest email to a user using SendGrid
 * @param {string} userEmail - User's email address
 * @param {string} userName - User's first name
 * @param {Array} followups - Array of follow-up objects with customerName, customerPhone, messageBody
 * @returns {Promise<Object>} - SendGrid send result
 */
async function sendDailyDigest(userEmail, userName, followups) {
  initializeSendGrid();

  if (!isConfigured) {
    throw new Error("SendGrid API key not configured");
  }

  const today = new Date();

  const msg = {
    to: userEmail,
    from: process.env.EMAIL_FROM || "noreply@example.com",
    subject: `Your Follow-Ups for Today (${followups.length})`,
    html: generateEmailHTML(userName, followups, today),
  };

  try {
    const response = await sgMail.send(msg);
    console.log(`✅ Digest email sent to ${userEmail} via SendGrid`);
    return { success: true, messageId: response[0].headers["x-message-id"] };
  } catch (error) {
    console.error(`❌ Failed to send digest to ${userEmail}:`, error.message);
    if (error.response) {
      console.error("SendGrid error details:", error.response.body);
    }
    throw error;
  }
}

/**
 * Test email configuration with SendGrid
 * @returns {Promise<boolean>} - True if configuration is valid
 */
async function testEmailConfig() {
  try {
    initializeSendGrid();

    if (!process.env.SENDGRID_API_KEY) {
      console.error("❌ SENDGRID_API_KEY not set");
      return false;
    }

    if (!process.env.EMAIL_FROM) {
      console.error("❌ EMAIL_FROM not set");
      return false;
    }

    console.log("✅ SendGrid email configuration is valid");
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error.message);
    return false;
  }
}

module.exports = {
  sendDailyDigest,
  formatSMSLink,
  formatPhoneForSMS,
  testEmailConfig,
};
