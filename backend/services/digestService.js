const pool = require("../db");
const { sendDailyDigest } = require("./emailService");

/**
 * Digest service for querying and sending daily follow-up emails
 */

/**
 * Get all users with pending follow-ups for today who have email digest enabled
 * @returns {Promise<Array>} - Array of users with their follow-ups
 */
async function getUsersWithFollowups() {
  const query = `
    SELECT 
      u.userId AS "userId",
      u.email AS "email",
      u.firstName AS "firstName",
      u.lastName AS "lastName",
      u.emailDigestTime AS "emailDigestTime",
      u.emailDigestTimezone AS "emailDigestTimezone",
      json_agg(
        json_build_object(
          'followupId', f.followupId,
          'customerName', c.firstName || ' ' || c.lastName,
          'customerPhone', c.phoneNumber,
          'messageBody', f.messageBody,
          'messageSubject', f.messageSubject,
          'scheduledDate', f.scheduledDate
        ) ORDER BY c.lastName, c.firstName
      ) as followups
    FROM users u
    INNER JOIN followups f ON u.userId = f.userId
    INNER JOIN customers c ON f.customerId = c.customerId
    WHERE f.scheduledDate = CURRENT_DATE
      AND f.status = 'pending'
      AND u.emailDigestEnabled = true
    GROUP BY u.userId, u.email, u.firstName, u.lastName, u.emailDigestTime, u.emailDigestTimezone
    HAVING COUNT(f.followupId) > 0
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error querying users with follow-ups:", error);
    throw error;
  }
}

/**
 * Check if digest was already sent to user today
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - True if already sent
 */
async function wasDigestSentToday(userId) {
  const query = `
    SELECT digestId 
    FROM email_digests 
    WHERE userId = $1 
      AND sentDate = CURRENT_DATE 
      AND status = 'sent'
    LIMIT 1
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking digest sent status:", error);
    throw error;
  }
}

/**
 * Record that a digest email was sent
 * @param {number} userId - User ID
 * @param {number} followupCount - Number of follow-ups in the digest
 * @param {string} status - 'sent', 'failed', or 'skipped'
 * @param {string} errorMessage - Error message if failed
 * @returns {Promise<void>}
 */
async function recordDigestSent(
  userId,
  followupCount,
  status = "sent",
  errorMessage = null,
) {
  const query = `
    INSERT INTO email_digests (userId, sentDate, followupCount, status, errorMessage)
    VALUES ($1, CURRENT_DATE, $2, $3, $4)
    ON CONFLICT (userId, sentDate) 
    DO UPDATE SET 
      followupCount = EXCLUDED.followupCount,
      status = EXCLUDED.status,
      errorMessage = EXCLUDED.errorMessage,
      sentAt = CURRENT_TIMESTAMP
  `;

  try {
    await pool.query(query, [userId, followupCount, status, errorMessage]);
  } catch (error) {
    console.error("Error recording digest sent:", error);
    throw error;
  }
}

/**
 * Process and send digest email for a user
 * @param {Object} user - User object with email, name, and follow-ups
 * @returns {Promise<boolean>} - True if sent successfully
 */
async function processUserDigest(user) {
  // Handle both camelCase and lowercase property names from PostgreSQL
  const userId = user.userId || user.userid;
  const email = user.email;
  const firstName = user.firstName || user.firstname;
  const followups = user.followups;

  console.log(
    `Processing digest for user: ${email}, firstName: ${firstName}, userId: ${userId}`,
  );

  try {
    // Check if already sent today
    const alreadySent = await wasDigestSentToday(userId);
    if (alreadySent) {
      console.log(`⏭️  Digest already sent to ${email} today`);
      return false;
    }

    // Send email - use firstName or a fallback if undefined
    const name = firstName || "there";
    await sendDailyDigest(email, name, followups);

    // Record success
    await recordDigestSent(userId, followups.length, "sent");

    return true;
  } catch (error) {
    console.error(`❌ Failed to process digest for ${email}:`, error.message);

    // Record failure
    await recordDigestSent(userId, followups.length, "failed", error.message);

    return false;
  }
}

module.exports = {
  getUsersWithFollowups,
  wasDigestSentToday,
  recordDigestSent,
  processUserDigest,
};
