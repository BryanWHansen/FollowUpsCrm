const cron = require("node-cron");
const {
  getUsersWithFollowups,
  processUserDigest,
} = require("../services/digestService");

/**
 * Daily digest scheduler with timezone support
 * Checks every 15 minutes if any user's digest time has arrived
 */

/**
 * Check if current time matches user's configured digest time
 * @param {string} digestTime - User's digest time (HH:MM:SS)
 * @param {string} timezone - User's timezone
 * @returns {boolean} - True if current time matches
 */
function isDigestTime(digestTime, timezone) {
  try {
    const now = new Date();

    // Get current time in user's timezone
    const userTime = new Date(
      now.toLocaleString("en-US", { timeZone: timezone }),
    );

    // Parse digest time
    const [hours, minutes] = digestTime.split(":").map(Number);

    // Check if current hour and minute match (with 15-minute window)
    const currentHours = userTime.getHours();
    const currentMinutes = userTime.getMinutes();

    return (
      currentHours === hours &&
      currentMinutes >= minutes &&
      currentMinutes < minutes + 15
    );
  } catch (error) {
    console.error("Error checking digest time:", error);
    return false;
  }
}

/**
 * Process all daily digests
 */
async function processDailyDigests() {
  console.log("🔍 Checking for scheduled digests...");

  try {
    // Get all users with follow-ups today
    const users = await getUsersWithFollowups();

    if (users.length === 0) {
      console.log("✅ No users with follow-ups today");
      return;
    }

    console.log(`📧 Found ${users.length} user(s) with follow-ups today`);

    let sentCount = 0;

    // Process each user
    for (const user of users) {
      // Check if it's time to send for this user
      const shouldSend = isDigestTime(
        user.emailDigestTime,
        user.emailDigestTimezone,
      );

      if (shouldSend) {
        console.log(`⏰ Digest time reached for ${user.email}`);
        const success = await processUserDigest(user);
        if (success) {
          sentCount++;
        }
      }
    }

    if (sentCount > 0) {
      console.log(`✅ Successfully sent ${sentCount} digest email(s)`);
    }
  } catch (error) {
    console.error("❌ Error processing daily digests:", error);
  }
}

/**
 * Initialize the scheduler
 */
function initializeScheduler() {
  const checkInterval = parseInt(process.env.DAILY_DIGEST_CHECK_INTERVAL) || 15;

  console.log(
    `🚀 Daily digest scheduler initialized (checking every ${checkInterval} minutes)`,
  );

  // Run every N minutes
  cron.schedule(`*/${checkInterval} * * * *`, async () => {
    await processDailyDigests();
  });

  // Also run on startup (after 30 seconds)
  setTimeout(async () => {
    console.log("🔄 Running initial digest check...");
    await processDailyDigests();
  }, 30000);
}

module.exports = { initializeScheduler, processDailyDigests };
