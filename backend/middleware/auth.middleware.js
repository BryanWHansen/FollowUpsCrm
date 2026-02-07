// Authentication middleware for protecting routes
const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT tokens
 * Verifies the token and attaches user info to req.user
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // Contains userId, email from token payload
    next();
  });
};

/**
 * Middleware to ensure user context is available
 * Should be used after authenticateToken
 */
const attachUserContext = (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(403).json({ error: 'User context required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  attachUserContext
};
