// Customer routes
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All customer routes require authentication
router.use(authenticateToken);

// GET /api/customers - Get all customers
router.get('/', customerController.getAllCustomers);

// GET /api/customers/:id - Get customer by id
router.get('/:id', customerController.getCustomerById);

// POST /api/customers - Create a new customer
router.post('/', customerController.createCustomer);

// PUT /api/customers/:id - Update a customer
router.put('/:id', customerController.updateCustomer);

// DELETE /api/customers/:id - Delete a customer
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
