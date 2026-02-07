// Authentication routes
const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: {
    error: "Too many authentication attempts, please try again later",
  },
});

// POST /api/auth/register - Register a new user
router.post("/register", authLimiter, authController.register);

// POST /api/auth/login - Login user
router.post("/login", authLimiter, authController.login);

// POST /api/auth/logout - Logout user
router.post("/logout", authenticateToken, authController.logout);

// GET /api/auth/me - Get current user info
router.get("/me", authenticateToken, authController.getCurrentUser);

// PUT /api/auth/me - Update current user info
router.put("/me", authenticateToken, authController.updateUser);
// PUT /api/auth/change-password - Change user password
router.put(
  "/change-password",
  authenticateToken,
  authController.changePassword,
);
module.exports = router;
