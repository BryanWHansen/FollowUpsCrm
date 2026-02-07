// Interaction routes
const express = require("express");
const router = express.Router();
const interactionController = require("../controllers/interaction.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// All interaction routes require authentication
router.use(authenticateToken);

// GET /api/interactions/without-vehicles - Get interactions without vehicles (to-do list)
router.get(
  "/without-vehicles",
  interactionController.getInteractionsWithoutVehicles,
);

// GET /api/interactions - Get all interactions (with optional filters)
router.get("/", interactionController.getAllInteractions);

// GET /api/interactions/:id - Get interaction by id
router.get("/:id", interactionController.getInteractionById);

// POST /api/interactions - Create a new interaction
router.post("/", interactionController.createInteraction);

// PUT /api/interactions/:id - Update an interaction
router.put("/:id", interactionController.updateInteraction);

// DELETE /api/interactions/:id - Delete an interaction
router.delete("/:id", interactionController.deleteInteraction);

module.exports = router;
