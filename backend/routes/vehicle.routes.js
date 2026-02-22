// Vehicle routes
const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicle.controller");
const {
  authenticateToken,
  requireEmailVerification,
} = require("../middleware/auth.middleware");

// All vehicle routes require authentication
router.use(authenticateToken);

// GET /api/vehicles - Get all vehicles
router.get("/", vehicleController.getAllVehicles);

// POST /api/vehicles - Create a new vehicle (requires email verification)
router.post("/", requireEmailVerification, vehicleController.createVehicle);

// PUT /api/vehicles/:id - Update a vehicle (requires email verification)
router.put("/:id", requireEmailVerification, vehicleController.updateVehicle);

// DELETE /api/vehicles/:id - Delete vehicle (requires email verification)
router.delete(
  "/:id",
  requireEmailVerification,
  vehicleController.deleteVehicle,
);

module.exports = router;
