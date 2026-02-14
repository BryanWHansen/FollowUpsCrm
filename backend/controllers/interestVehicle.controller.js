// Interest Vehicle controller - handles customer vehicle interests
const pool = require('../db');
const { mapToInterestVehicle, validateInterestVehicle } = require('../models/interestVehicle.model');
const { generateFollowupsForVehicle, regenerateFollowupsForInteraction } = require('../utils/followupGenerator');

/**
 * Get all interest vehicles for the authenticated user
 */
const getAllInterestVehicles = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(
      'SELECT * FROM customerinterestvehicles WHERE userId = $1 ORDER BY createdAt DESC',
      [userId]
    );
    
    const interestVehicles = result.rows.map(mapToInterestVehicle);
    res.json(interestVehicles);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get interest vehicles by customer id
 */
const getInterestVehiclesByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const userId = req.user.userId;
    
    const result = await pool.query(
      'SELECT * FROM customerinterestvehicles WHERE customerId = $1 AND userId = $2 ORDER BY createdAt DESC',
      [customerId, userId]
    );
    
    const interestVehicles = result.rows.map(mapToInterestVehicle);
    res.json(interestVehicles);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Create a new interest vehicle and auto-generate follow-ups
 */
const createInterestVehicle = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.userId;
    const interestVehicle = req.body;
    
    const validation = validateInterestVehicle(interestVehicle);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    const { customerId, interactionId, make, model, year, color, trim, vehicleType, notes } = interestVehicle;
    
    // Verify customer belongs to user
    const customerCheck = await client.query(
      'SELECT customerId FROM customers WHERE customerId = $1 AND userId = $2',
      [customerId, userId]
    );
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // If interactionId provided, verify it belongs to user and customer
    let interactionType = null;
    let interactionDate = null;
    if (interactionId) {
      const interactionCheck = await client.query(
        'SELECT interactionId, interactiontype, interactiondate FROM interactions WHERE interactionId = $1 AND userId = $2 AND customerId = $3',
        [interactionId, userId, customerId]
      );
      if (interactionCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Interaction not found' });
      }
      interactionType = interactionCheck.rows[0].interactiontype;
      interactionDate = interactionCheck.rows[0].interactiondate;
    }
    
    await client.query('BEGIN');
    
    // Insert interest vehicle
    const result = await client.query(`
      INSERT INTO customerinterestvehicles 
      (userId, customerId, interactionId, make, model, year, color, trim, vehicleType, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [userId, customerId, interactionId || null, make || null, model || null, 
        year || null, color || null, trim || null, vehicleType || null, notes || null]);
    
    const newInterestVehicle = mapToInterestVehicle(result.rows[0]);
    const generatedFollowups = [];
    
    // Generate follow-ups if vehicle is associated with an interaction
    if (interactionId && interactionType) {
      const followups = await generateFollowupsForVehicle(client, {
        userId,
        customerId,
        interactionId,
        interactionType,
        interactionDate,
        vehicleMake: make || '',
        vehicleModel: model || '',
        vehicleYear: year || ''
      });
      generatedFollowups.push(...followups);
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      interestVehicle: newInterestVehicle,
      generatedFollowups
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

/**
 * Update an interest vehicle
 */
const updateInterestVehicle = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const userId = req.user.userId;
    const updates = req.body;
    
    // Verify interest vehicle belongs to user and get interactionId
    const checkResult = await client.query(
      'SELECT interactionId FROM customerinterestvehicles WHERE interestVehicleId = $1 AND userId = $2',
      [id, userId]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Interest vehicle not found' });
    }
    
    const interactionId = checkResult.rows[0].interactionid;
    
    // Build update query dynamically
    const allowedFields = ['make', 'model', 'year', 'color', 'trim', 'vehicleType', 'notes'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
        paramCount++;
      }
    });
    
    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(id, userId);
    
    const result = await client.query(`
      UPDATE customerinterestvehicles 
      SET ${updateFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP
      WHERE interestVehicleId = $${paramCount} AND userId = $${paramCount + 1}
      RETURNING *
    `, values);
    
    // Regenerate follow-ups if interest vehicle has an interaction
    if (interactionId) {
      await regenerateFollowupsForInteraction(client, interactionId, userId);
    }
    
    await client.query('COMMIT');
    
    const updatedInterestVehicle = mapToInterestVehicle(result.rows[0]);
    res.json(updatedInterestVehicle);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

/**
 * Delete an interest vehicle
 */
const deleteInterestVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const result = await pool.query(
      'DELETE FROM customerinterestvehicles WHERE interestVehicleId = $1 AND userId = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Interest vehicle not found' });
    }
    
    res.json({ message: 'Interest vehicle deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllInterestVehicles,
  getInterestVehiclesByCustomerId,
  createInterestVehicle,
  updateInterestVehicle,
  deleteInterestVehicle
};
