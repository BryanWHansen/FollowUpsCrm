// Interest Vehicle routes
const express = require("express");
const router = express.Router();
const interestVehicleController = require("../controllers/interestVehicle.controller");
const {
  authenticateToken,
  requireEmailVerification,
} = require("../middleware/auth.middleware");

// All interest vehicle routes require authentication
router.use(authenticateToken);

// GET /api/interest-vehicles - Get all interest vehicles
router.get("/", interestVehicleController.getAllInterestVehicles);

// GET /api/interest-vehicles/customer/:customerId - Get interest vehicles by customer
router.get(
  "/customer/:customerId",
  interestVehicleController.getInterestVehiclesByCustomerId,
);

// POST /api/interest-vehicles - Create a new interest vehicle (requires email verification)
router.post(
  "/",
  requireEmailVerification,
  interestVehicleController.createInterestVehicle,
);

// PUT /api/interest-vehicles/:id - Update an interest vehicle (requires email verification)
router.put(
  "/:id",
  requireEmailVerification,
  interestVehicleController.updateInterestVehicle,
);

// DELETE /api/interest-vehicles/:id - Delete an interest vehicle (requires email verification)
router.delete(
  "/:id",
  requireEmailVerification,
  interestVehicleController.deleteInterestVehicle,
);

module.exports = router;
