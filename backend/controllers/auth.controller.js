// Authentication controller - handles all auth-related business logic
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../db");
const {
  mapToUser,
  validateUserRegistration,
  validateUserLogin,
} = require("../models/user.model");
const { sendVerificationEmail } = require("../services/emailService");
const { get } = require("../routes/auth.routes");

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const userData = req.body;

    const validation = validateUserRegistration(userData);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { email, password, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT userId FROM users WHERE email = $1",
      [email.toLowerCase()],
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert user with email digest defaults and verification token
    const result = await pool.query(
      `INSERT INTO users (
        email, passwordHash, firstName, lastName,
        emailDigestEnabled, emailDigestTime, emailDigestTimezone,
        email_verified, verification_token, verification_token_expiry
      ) 
       VALUES ($1, $2, $3, $4, true, '08:00:00', 'America/New_York', false, $5, $6) 
       RETURNING *`,
      [
        email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        verificationToken,
        verificationTokenExpiry,
      ],
    );

    const newUser = mapToUser(result.rows[0]);

    // Send verification email
    await sendVerificationEmail(
      email.toLowerCase(),
      verificationToken,
      firstName,
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.userId, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "7d" },
    );

    res.status(201).json({
      ...newUser,
      token,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const credentials = req.body;

    const validation = validateUserLogin(credentials);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { email, password } = credentials;

    // Find user by email
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const userRow = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userRow.passwordhash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if this is first login (lastLogin is NULL)
    const isFirstLogin = userRow.lastlogin === null;

    // Update last login
    await pool.query("UPDATE users SET lastLogin = NOW() WHERE userId = $1", [
      userRow.userid,
    ]);

    const user = mapToUser(userRow);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "7d" },
    );

    res.json({
      ...user,
      token,
      isFirstLogin,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Logout user (client-side token removal)
 */
const logout = async (req, res) => {
  // In a stateless JWT implementation, logout is handled client-side by removing the token
  // This endpoint can be used for logging or future token blacklist implementation
  res.json({ message: "Logout successful" });
};

/**
 * Get current user info
 */
const getCurrentUser = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await pool.query("SELECT * FROM users WHERE userId = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = mapToUser(result.rows[0]);
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Update current user info
 */
const updateUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { firstName, lastName, email } = req.body;

    // Validate input
    if (!firstName || !lastName || !email) {
      return res
        .status(400)
        .json({ error: "First name, last name, and email are required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if email is already taken by another user
    const existingUser = await pool.query(
      "SELECT userId FROM users WHERE email = $1 AND userId != $2",
      [email.toLowerCase(), userId],
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Email already in use by another user" });
    }

    // Check if email changed
    const currentUserResult = await pool.query(
      "SELECT email FROM users WHERE userId = $1",
      [userId],
    );
    const emailChanged =
      currentUserResult.rows[0].email !== email.toLowerCase();

    // If email changed, reset verification and send new verification email
    if (emailChanged) {
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpiry = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ); // 24 hours

      // Update user with new email and reset verification
      const result = await pool.query(
        `UPDATE users 
         SET firstName = $1, lastName = $2, email = $3, 
             email_verified = false, verification_token = $5, 
             verification_token_expiry = $6, updatedAt = NOW()
         WHERE userId = $4
         RETURNING *`,
        [
          firstName,
          lastName,
          email.toLowerCase(),
          userId,
          verificationToken,
          verificationTokenExpiry,
        ],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = mapToUser(result.rows[0]);

      // Send verification email to new address
      await sendVerificationEmail(
        email.toLowerCase(),
        verificationToken,
        firstName,
      );

      return res.json(updatedUser);
    }

    // Email didn't change, just update other fields
    const result = await pool.query(
      `UPDATE users 
       SET firstName = $1, lastName = $2, email = $3, updatedAt = NOW()
       WHERE userId = $4
       RETURNING *`,
      [firstName, lastName, email.toLowerCase(), userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = mapToUser(result.rows[0]);
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Change user password
 */
const changePassword = async (req, res) => {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });
    }

    // Get user with current password hash
    const result = await pool.query(
      "SELECT passwordHash FROM users WHERE userId = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRow = result.rows[0];

    // Verify current password
    const passwordMatch = await bcrypt.compare(
      currentPassword,
      userRow.passwordhash,
    );

    if (!passwordMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      "UPDATE users SET passwordHash = $1, updatedAt = NOW() WHERE userId = $2",
      [newPasswordHash, userId],
    );

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

const updateEmailPreferences = async (req, res) => {
  const userId = req.user.userId;
  const { emailDigestEnabled, emailDigestTime, emailDigestTimezone } = req.body;

  try {
    // Validate inputs
    if (
      emailDigestTime &&
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(emailDigestTime)
    ) {
      return res.status(400).json({ error: "Invalid time format. Use HH:MM" });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (emailDigestEnabled !== undefined) {
      updates.push(`emailDigestEnabled = $${paramCount}`);
      values.push(emailDigestEnabled);
      paramCount++;
    }

    if (emailDigestTime !== undefined) {
      updates.push(`emailDigestTime = $${paramCount}`);
      values.push(emailDigestTime);
      paramCount++;
    }

    if (emailDigestTimezone !== undefined) {
      updates.push(`emailDigestTimezone = $${paramCount}`);
      values.push(emailDigestTimezone);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    // Add userId to values
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(", ")}, updatedAt = CURRENT_TIMESTAMP
      WHERE userId = $${paramCount}
      RETURNING userId, email, emailDigestEnabled, emailDigestTime, emailDigestTimezone
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Email preferences updated successfully",
      preferences: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating email preferences:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Also update getProfile or similar endpoint to include email preferences
const getProfile = async (req, res) => {
  const userId = req.user.userId;

  try {
    const query = `
      SELECT userId, email, firstName, lastName, 
             emailDigestEnabled, emailDigestTime, emailDigestTimezone,
             createdAt, updatedAt
      FROM users 
      WHERE userId = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Delete user account and all associated data
 */
const deleteAccount = async (req, res) => {
  const userId = req.user.userId;
  const { password } = req.body;

  try {
    // Verify password before deletion
    if (!password) {
      return res
        .status(400)
        .json({ error: "Password is required to delete account" });
    }

    // Get user's current password hash
    const userResult = await pool.query(
      "SELECT passwordHash FROM users WHERE userId = $1",
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(
      password,
      userResult.rows[0].passwordhash,
    );

    if (!passwordMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Delete user - all related data will be cascade deleted
    // This includes: customers, interactions, vehicles, followups, templates, email_digests
    await pool.query("DELETE FROM users WHERE userId = $1", [userId]);

    res.json({
      success: true,
      message: "Account and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Verify email with token
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    // Find user with this token
    const result = await pool.query(
      `SELECT * FROM users 
       WHERE verification_token = $1 
       AND verification_token_expiry > NOW()`,
      [token],
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification token" });
    }

    const userRow = result.rows[0];

    // Update user to verified and clear token
    await pool.query(
      `UPDATE users 
       SET email_verified = true, verification_token = NULL, verification_token_expiry = NULL
       WHERE userId = $1`,
      [userRow.userid],
    );

    const user = mapToUser(userRow);
    user.emailVerified = true;

    res.json({
      message: "Email verified successfully",
      user,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Resend verification email
 */
const resendVerification = async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user info
    const result = await pool.query("SELECT * FROM users WHERE userId = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRow = result.rows[0];

    // Check if already verified
    if (userRow.email_verified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await pool.query(
      `UPDATE users 
       SET verification_token = $1, verification_token_expiry = $2
       WHERE userId = $3`,
      [verificationToken, verificationTokenExpiry, userId],
    );

    // Send verification email
    await sendVerificationEmail(
      userRow.email,
      verificationToken,
      userRow.firstname,
    );

    res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  updateUser,
  changePassword,
  updateEmailPreferences,
  getProfile,
  deleteAccount,
  verifyEmail,
  resendVerification,
};
