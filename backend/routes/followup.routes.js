// Follow-up routes - handles both templates and follow-ups
const express = require("express");
const router = express.Router();
const followupController = require("../controllers/followup.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

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

// POST /api/followups/templates - Create a new template
router.post("/templates", followupController.createTemplate);

// PUT /api/followups/templates/:id - Update a template
router.put("/templates/:id", followupController.updateTemplate);

// DELETE /api/followups/templates/:id - Delete a template
router.delete("/templates/:id", followupController.deleteTemplate);

// ============================================
// FOLLOW-UP ROUTES
// ============================================

// GET /api/followups/upcoming - Get upcoming follow-ups (next N days)
router.get("/upcoming", followupController.getUpcomingFollowUps);

// POST /api/followups/send-digest - Manually send digest for today's pending follow-ups
router.post("/send-digest", followupController.sendDigestNow);

// GET /api/followups - Get all follow-ups
router.get("/", followupController.getAllFollowUps);

// GET /api/followups/:id - Get follow-up by id
router.get("/:id", followupController.getFollowUpById);

// PUT /api/followups/:id/complete - Mark follow-up as completed
router.put("/:id/complete", followupController.completeFollowUp);

// PUT /api/followups/:id/dismiss - Dismiss a follow-up
router.put("/:id/dismiss", followupController.dismissFollowUp);

// PUT /api/followups/:id/snooze - Snooze a follow-up
router.put("/:id/snooze", followupController.snoozeFollowUp);

// DELETE /api/followups/:id - Delete a follow-up
router.delete("/:id", followupController.deleteFollowUp);

module.exports = router;
