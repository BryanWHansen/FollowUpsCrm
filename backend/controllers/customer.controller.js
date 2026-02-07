// Customer controller - handles all customer-related business logic
const pool = require('../db');
const { mapToCustomer, validateCustomer } = require('../models/customer.model');

/**
 * Get all customers for the authenticated user
 */
const getAllCustomers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      'SELECT * FROM customers WHERE userId = $1 ORDER BY customerid',
      [userId]
    );
    const customers = result.rows.map(mapToCustomer);
    res.json(customers);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get customer by id
 */
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Query with both customerId and userId to ensure ownership
    const result = await pool.query(
      'SELECT * FROM customers WHERE customerid = $1 AND userId = $2',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const customer = mapToCustomer(result.rows[0]);
    res.json(customer);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Create a new customer
 */
const createCustomer = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Accept both { customer: {...} } and direct properties
    const customer = req.body.customer || req.body;
    
    const validation = validateCustomer(customer);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    const { firstName, lastName, preferredName, birthday, phoneNumber, address, email, notes } = customer;
    
    const result = await pool.query(
      `INSERT INTO customers (userId, firstName, lastName, preferredName, birthday, phoneNumber, address, email, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [userId, firstName, lastName, preferredName || null, birthday || null, phoneNumber || null, address || null, email || null, notes || null]
    );
    
    const newCustomer = mapToCustomer(result.rows[0]);
    res.status(201).json(newCustomer);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Delete a customer
 */
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Check ownership
    const checkResult = await pool.query(
      'SELECT customerId FROM customers WHERE customerId = $1 AND userId = $2',
      [id, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Delete customer (CASCADE will handle related records)
    await pool.query(
      'DELETE FROM customers WHERE customerId = $1 AND userId = $2',
      [id, userId]
    );
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Update a customer
 */
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Accept both { customer: {...} } and direct properties
    const customer = req.body.customer || req.body;
    
    const validation = validateCustomer(customer);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    // Check ownership
    const checkResult = await pool.query(
      'SELECT customerId FROM customers WHERE customerId = $1 AND userId = $2',
      [id, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const { firstName, lastName, preferredName, birthday, phoneNumber, address, email, notes } = customer;
    
    const result = await pool.query(
      `UPDATE customers 
       SET firstName = $1, lastName = $2, preferredName = $3, birthday = $4, 
           phoneNumber = $5, address = $6, email = $7, notes = $8, updatedAt = CURRENT_TIMESTAMP
       WHERE customerId = $9 AND userId = $10
       RETURNING *`,
      [firstName, lastName, preferredName || null, birthday || null, phoneNumber || null, address || null, email || null, notes || null, id, userId]
    );
    
    const updatedCustomer = mapToCustomer(result.rows[0]);
    res.json(updatedCustomer);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
