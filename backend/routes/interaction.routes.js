// Interaction routes
const express = require("express");
const router = express.Router();
const interactionController = require("../controllers/interaction.controller");
const {
  authenticateToken,
  requireEmailVerification,
} = require("../middleware/auth.middleware");

// All interaction routes require authentication
router.use(authenticateToken);

// GET /api/interactions/without-vehicles - Get interactions without vehicles (to-do list)
router.get(
  "/without-vehicles",
  interactionController.getInteractionsWithoutVehicles,
);

// GET /api/interactions/types-without-templates - Get interaction types without templates
router.get(
  "/types-without-templates",
  interactionController.getInteractionTypesWithoutTemplates,
);

// GET /api/interactions - Get all interactions (with optional filters)
router.get("/", interactionController.getAllInteractions);

// GET /api/interactions/:id - Get interaction by id
router.get("/:id", interactionController.getInteractionById);

// POST /api/interactions - Create a new interaction (requires email verification)
router.post(
  "/",
  requireEmailVerification,
  interactionController.createInteraction,
);

// PUT /api/interactions/:id - Update an interaction (requires email verification)
router.put(
  "/:id",
  requireEmailVerification,
  interactionController.updateInteraction,
);

// DELETE /api/interactions/:id - Delete an interaction (requires email verification)
router.delete(
  "/:id",
  requireEmailVerification,
  interactionController.deleteInteraction,
);

module.exports = router;
