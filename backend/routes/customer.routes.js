// Customer routes
const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const {
  authenticateToken,
  requireEmailVerification,
} = require("../middleware/auth.middleware");

// All customer routes require authentication
router.use(authenticateToken);

// GET /api/customers - Get all customers
router.get("/", customerController.getAllCustomers);

// GET /api/customers/:id - Get customer by id
router.get("/:id", customerController.getCustomerById);

// POST /api/customers - Create a new customer (requires email verification)
router.post("/", requireEmailVerification, customerController.createCustomer);

// PUT /api/customers/:id - Update a customer (requires email verification)
router.put("/:id", requireEmailVerification, customerController.updateCustomer);

// DELETE /api/customers/:id - Delete a customer (requires email verification)
router.delete(
  "/:id",
  requireEmailVerification,
  customerController.deleteCustomer,
);

module.exports = router;
