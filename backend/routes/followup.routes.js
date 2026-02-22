// Follow-up routes - handles both templates and follow-ups
const express = require("express");
const router = express.Router();
const followupController = require("../controllers/followup.controller");
const {
  authenticateToken,
  requireEmailVerification,
} = require("../middleware/auth.middleware");

// All follow-up routes require authentication
router.use(authenticateToken);

// ============================================
// TEMPLATE ROUTES
// ============================================

// GET /api/followups/templates - Get all templates
router.get("/templates", followupController.getAllTemplates);

// GET /api/followups/templates/variables - Get available template variables
router.get("/templates/variables", followupController.getTemplateVariablesList);

// GET /api/followups/templates/:id - Get template by id
router.get("/templates/:id", followupController.getTemplateById);

// POST /api/followups/templates - Create a new template (requires email verification)
router.post(
  "/templates",
  requireEmailVerification,
  followupController.createTemplate,
);

// PUT /api/followups/templates/:id - Update a template (requires email verification)
router.put(
  "/templates/:id",
  requireEmailVerification,
  followupController.updateTemplate,
);

// DELETE /api/followups/templates/:id - Delete a template (requires email verification)
router.delete(
  "/templates/:id",
  requireEmailVerification,
  followupController.deleteTemplate,
);

// ============================================
// FOLLOW-UP ROUTES
// ============================================

// GET /api/followups/upcoming - Get upcoming follow-ups (next N days)
router.get("/upcoming", followupController.getUpcomingFollowUps);

// POST /api/followups/send-digest - Manually send digest for today's pending follow-ups (requires email verification)
router.post(
  "/send-digest",
  requireEmailVerification,
  followupController.sendDigestNow,
);

// POST /api/followups/send-overdue - Manually send overdue follow-ups from the past week (requires email verification)
router.post(
  "/send-overdue",
  requireEmailVerification,
  followupController.sendOverdueFollowupsNow,
);

// POST /api/followups/send-today - Manually send today's pending follow-ups (requires email verification)
router.post(
  "/send-today",
  requireEmailVerification,
  followupController.sendTodayFollowupsNow,
);

// GET /api/followups - Get all follow-ups
router.get("/", followupController.getAllFollowUps);

// GET /api/followups/:id - Get follow-up by id
router.get("/:id", followupController.getFollowUpById);

// PUT /api/followups/:id/complete - Mark follow-up as completed (requires email verification)
router.put(
  "/:id/complete",
  requireEmailVerification,
  followupController.completeFollowUp,
);

// PUT /api/followups/:id/dismiss - Dismiss a follow-up (requires email verification)
router.put(
  "/:id/dismiss",
  requireEmailVerification,
  followupController.dismissFollowUp,
);

// PUT /api/followups/:id/snooze - Snooze a follow-up (requires email verification)
router.put(
  "/:id/snooze",
  requireEmailVerification,
  followupController.snoozeFollowUp,
);

// DELETE /api/followups/:id - Delete a follow-up (requires email verification)
router.delete(
  "/:id",
  requireEmailVerification,
  followupController.deleteFollowUp,
);

module.exports = router;
