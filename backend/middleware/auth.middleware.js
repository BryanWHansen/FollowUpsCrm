// Authentication middleware for protecting routes
const jwt = require("jsonwebtoken");
const pool = require("../db");

/**
 * Middleware to authenticate JWT tokens
 * Verifies the token and attaches user info to req.user
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user; // Contains userId, email from token payload
    next();
  });
};

/**
 * Middleware to ensure user context is available
 * Should be used after authenticateToken
 */
const attachUserContext = (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(403).json({ error: "User context required" });
  }
  next();
};

/**
 * Middleware to ensure email is verified
 * Should be used after authenticateToken
 */
const requireEmailVerification = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(403).json({ error: "User context required" });
    }

    const result = await pool.query(
      "SELECT email_verified FROM users WHERE userId = $1",
      [req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!result.rows[0].email_verified) {
      return res.status(403).json({
        error: "Email verification required",
        emailVerified: false,
      });
    }

    next();
  } catch (err) {
    console.error("Email verification check error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  authenticateToken,
  attachUserContext,
  requireEmailVerification,
};
