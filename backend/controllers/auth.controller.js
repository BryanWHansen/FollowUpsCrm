// Authentication controller - handles all auth-related business logic
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { mapToUser, validateUserRegistration, validateUserLogin } = require('../models/user.model');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const userData = req.body;
    
    const validation = validateUserRegistration(userData);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    const { email, password, firstName, lastName } = userData;
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT userId FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, passwordHash, firstName, lastName) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [email.toLowerCase(), passwordHash, firstName, lastName]
    );
    
    const newUser = mapToUser(result.rows[0]);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.userId, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );
    
    res.status(201).json({
      ...newUser,
      token
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const credentials = req.body;
    
    const validation = validateUserLogin(credentials);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    const { email, password } = credentials;
    
    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const userRow = result.rows[0];
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, userRow.passwordhash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login
    await pool.query('UPDATE users SET lastLogin = NOW() WHERE userId = $1', [userRow.userid]);
    
    const user = mapToUser(userRow);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );
    
    res.json({
      ...user,
      token
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Logout user (client-side token removal)
 */
const logout = async (req, res) => {
  // In a stateless JWT implementation, logout is handled client-side by removing the token
  // This endpoint can be used for logging or future token blacklist implementation
  res.json({ message: 'Logout successful' });
};

/**
 * Get current user info
 */
const getCurrentUser = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const result = await pool.query('SELECT * FROM users WHERE userId = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = mapToUser(result.rows[0]);
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser
};
