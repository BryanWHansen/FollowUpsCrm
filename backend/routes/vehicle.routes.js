// Vehicle routes
const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All vehicle routes require authentication
router.use(authenticateToken);

// GET /api/vehicles - Get all vehicles
router.get('/', vehicleController.getAllVehicles);

// POST /api/vehicles - Create a new vehicle
router.post('/', vehicleController.createVehicle);

// PUT /api/vehicles/:id - Update a vehicle
router.put('/:id', vehicleController.updateVehicle);

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
