// Interaction controller - handles all interaction-related business logic
const pool = require("../db");
const {
  mapToInteraction,
  validateInteraction,
} = require("../models/interaction.model");
const { mapToTemplate } = require("../models/template.model");
const { mapToFollowUp, renderTemplate } = require("../models/followup.model");
const {
  regenerateFollowupsForInteraction,
} = require("../utils/followupGenerator");

/**
 * Get all interactions for the authenticated user
 */
const getAllInteractions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { customerId, interactionType } = req.query;

    let query = `
      SELECT i.*, c.firstName as customerFirstName, c.lastName as customerLastName
      FROM interactions i
      JOIN customers c ON i.customerId = c.customerId
      WHERE i.userId = $1
    `;
    const params = [userId];

    // Add filters if provided
    if (customerId) {
      params.push(customerId);
      query += ` AND i.customerId = $${params.length}`;
    }

    if (interactionType) {
      params.push(interactionType);
      query += ` AND i.interactionType = $${params.length}`;
    }

    query += ` ORDER BY i.interactionDate DESC, i.createdAt DESC`;

    const result = await pool.query(query, params);
    const interactions = result.rows.map((row) => ({
      ...mapToInteraction(row),
      customerFirstName: row.customerfirstname,
      customerLastName: row.customerlastname,
    }));

    res.json(interactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get interaction by id
 */
const getInteractionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `
      SELECT i.*, c.firstName as customerFirstName, c.lastName as customerLastName
      FROM interactions i
      JOIN customers c ON i.customerId = c.customerId
      WHERE i.interactionId = $1 AND i.userId = $2
    `,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Interaction not found" });
    }

    const row = result.rows[0];
    const interaction = {
      ...mapToInteraction(row),
      customerFirstName: row.customerfirstname,
      customerLastName: row.customerlastname,
    };

    // Get related follow-ups
    const followupsResult = await pool.query(
      "SELECT * FROM followups WHERE interactionId = $1 AND userId = $2 ORDER BY scheduledDate",
      [id, userId],
    );
    interaction.followups = followupsResult.rows.map(mapToFollowUp);

    res.json(interaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get interactions without vehicles (to-do list for dashboard)
 */
const getInteractionsWithoutVehicles = async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT i.*, 
             c.firstName as customerFirstName, 
             c.lastName as customerLastName,
             c.phoneNumber as customerPhoneNumber,
             c.email as customerEmail
      FROM interactions i
      JOIN customers c ON i.customerId = c.customerId
      LEFT JOIN purchasedvehicles pv ON i.interactionid = pv.interactionid
      LEFT JOIN customerinterestvehicles iv ON i.interactionid = iv.interactionid
      WHERE i.userId = $1 
        AND (
          (i.interactionType = 'purchase' AND pv.vehicleid IS NULL)
          OR (i.interactionType != 'purchase' AND iv.interestvehicleid IS NULL)
        )
      ORDER BY i.interactionDate DESC, i.createdAt DESC
    `;

    const result = await pool.query(query, [userId]);
    const interactions = result.rows.map((row) => ({
      ...mapToInteraction(row),
      customerFirstName: row.customerfirstname,
      customerLastName: row.customerlastname,
      customerPhoneNumber: row.customerphonenumber,
      customerEmail: row.customeremail,
    }));

    res.json(interactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Create a new interaction
 */
const createInteraction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const interaction = req.body.interaction || req.body;

    const validation = validateInteraction(interaction);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { customerId, interactionType, interactionDate, notes } = interaction;

    // Verify customer belongs to user
    const customerCheck = await pool.query(
      "SELECT customerId FROM customers WHERE customerId = $1 AND userId = $2",
      [customerId, userId],
    );
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Ensure interactionDate is in YYYY-MM-DD format (no timezone conversion)
    // If it's already a string in that format, keep it as-is
    let dateToStore = interactionDate;
    if (interactionDate && typeof interactionDate === "string") {
      // Extract just the date part if there's any time component
      dateToStore = interactionDate.split("T")[0];
    }

    // Insert interaction - use explicit DATE casting to prevent timezone conversion
    const result = await pool.query(
      `
      INSERT INTO interactions (userId, customerId, interactionType, interactionDate, notes)
      VALUES ($1, $2, $3, $4::date, $5)
      RETURNING *
    `,
      [userId, customerId, interactionType, dateToStore, notes],
    );

    const newInteraction = mapToInteraction(result.rows[0]);

    // Auto-update customer status to 'customer' if interaction is a purchase
    if (interactionType === "purchase") {
      await pool.query(
        `UPDATE customers 
         SET customerStatus = 'customer', updatedAt = CURRENT_TIMESTAMP 
         WHERE customerId = $1 AND userId = $2 AND customerStatus != 'customer'`,
        [customerId, userId],
      );
    }

    res.status(201).json(newInteraction);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Delete an interaction
 */
const deleteInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      "DELETE FROM interactions WHERE interactionId = $1 AND userId = $2 RETURNING *",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Interaction not found" });
    }

    res.json({ message: "Interaction deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Update an interaction
 */
const updateInteraction = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const userId = req.user.userId;

    const interaction = req.body.interaction || req.body;

    const validation = validateInteraction(interaction);
    if (!validation.isValid) {
      await client.query("ROLLBACK");
      return res.status(400).json({ errors: validation.errors });
    }

    // Check ownership and get customer to verify it belongs to user
    const checkResult = await client.query(
      `SELECT i.interactionId 
       FROM interactions i
       JOIN customers c ON i.customerId = c.customerId
       WHERE i.interactionId = $1 AND i.userId = $2`,
      [id, userId],
    );

    if (checkResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Interaction not found" });
    }

    const { interactionType, interactionDate, notes } = interaction;

    // Ensure interactionDate is in YYYY-MM-DD format (no timezone conversion)
    let dateToStore = interactionDate;
    if (interactionDate && typeof interactionDate === "string") {
      dateToStore = interactionDate.split("T")[0];
    }

    const result = await client.query(
      `UPDATE interactions 
       SET interactionType = $1, interactionDate = $2::date, notes = $3
       WHERE interactionId = $4 AND userId = $5
       RETURNING *`,
      [interactionType, dateToStore, notes || null, id, userId],
    );

    // Check if this interaction has an associated vehicle (purchased or interest)
    const vehicleCheck = await client.query(
      `SELECT 1 FROM purchasedvehicles WHERE interactionId = $1
       UNION ALL
       SELECT 1 FROM customerinterestvehicles WHERE interactionId = $1
       LIMIT 1`,
      [id],
    );

    // Only regenerate follow-ups if the interaction has a vehicle
    if (vehicleCheck.rows.length > 0) {
      await regenerateFollowupsForInteraction(client, id, userId);
    }

    await client.query("COMMIT");

    const updatedInteraction = mapToInteraction(result.rows[0]);
    res.json(updatedInteraction);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};

/**
 * Get interaction types that don't have any templates
 */
const getInteractionTypesWithoutTemplates = async (req, res) => {
  try {
    const userId = req.user.userId;

    // All valid interaction types (same as in template validation)
    const validTypes = [
      "purchase",
      "interest",
      "test_drive",
      "general_inquiry",
    ];

    // Get interaction types that have active templates for this user
    const templatesResult = await pool.query(
      `SELECT DISTINCT interactionType FROM followuptemplates 
       WHERE userId = $1 AND isActive = true`,
      [userId],
    );

    const typesWithTemplates = templatesResult.rows.map(
      (row) => row.interactiontype,
    );

    console.log("Types with templates:", typesWithTemplates);
    console.log("Valid types:", validTypes);

    // Get count of interactions for each type
    const interactionsResult = await pool.query(
      `SELECT interactionType, COUNT(*) as count 
       FROM interactions 
       WHERE userId = $1 
       GROUP BY interactionType`,
      [userId],
    );

    const interactionCounts = {};
    interactionsResult.rows.forEach((row) => {
      interactionCounts[row.interactiontype] = parseInt(row.count);
    });

    // Find types without templates
    const typesWithoutTemplates = validTypes
      .filter((type) => !typesWithTemplates.includes(type))
      .map((type) => ({
        interactionType: type,
        count: interactionCounts[type] || 0,
      }));

    console.log("Types without templates:", typesWithoutTemplates);

    res.json(typesWithoutTemplates);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getAllInteractions,
  getInteractionById,
  getInteractionsWithoutVehicles,
  getInteractionTypesWithoutTemplates,
  createInteraction,
  updateInteraction,
  deleteInteraction,
};
