// Interest Vehicle routes
const express = require('express');
const router = express.Router();
const interestVehicleController = require('../controllers/interestVehicle.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All interest vehicle routes require authentication
router.use(authenticateToken);

// GET /api/interest-vehicles - Get all interest vehicles
router.get('/', interestVehicleController.getAllInterestVehicles);

// GET /api/interest-vehicles/customer/:customerId - Get interest vehicles by customer
router.get('/customer/:customerId', interestVehicleController.getInterestVehiclesByCustomerId);

// POST /api/interest-vehicles - Create a new interest vehicle
router.post('/', interestVehicleController.createInterestVehicle);

// PUT /api/interest-vehicles/:id - Update an interest vehicle
router.put('/:id', interestVehicleController.updateInterestVehicle);

// DELETE /api/interest-vehicles/:id - Delete an interest vehicle
router.delete('/:id', interestVehicleController.deleteInterestVehicle);

module.exports = router;
