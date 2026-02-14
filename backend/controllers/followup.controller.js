// Follow-up controller - handles template and follow-up business logic
const pool = require("../db");
const {
  mapToTemplate,
  validateTemplate,
  getTemplateVariables,
} = require("../models/template.model");
const {
  mapToFollowUp,
  validateFollowUpUpdate,
  renderTemplate,
} = require("../models/followup.model");
const { sendManualDigest } = require("../services/digestService");

// ============================================
// TEMPLATE CONTROLLERS
// ============================================

/**
 * Get all templates for the authenticated user
 */
const getAllTemplates = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { interactionType, isActive } = req.query;

    let query = "SELECT * FROM followuptemplates WHERE userId = $1";
    const params = [userId];

    // Add filters if provided
    if (interactionType) {
      params.push(interactionType);
      query += ` AND interactionType = $${params.length}`;
    }

    if (isActive !== undefined) {
      params.push(isActive === "true");
      query += ` AND isActive = $${params.length}`;
    }

    query += " ORDER BY interactionType, daysAfter";

    const result = await pool.query(query, params);
    const templates = result.rows.map(mapToTemplate);
    res.json(templates);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get template by id
 */
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      "SELECT * FROM followuptemplates WHERE templateId = $1 AND userId = $2",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    const template = mapToTemplate(result.rows[0]);
    res.json(template);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Create a new template
 */
const createTemplate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const template = req.body.template || req.body;

    const validation = validateTemplate(template);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const {
      templateName,
      interactionType,
      daysAfter,
      messageSubject,
      messageBody,
      isActive,
    } = template;

    const result = await pool.query(
      `
      INSERT INTO followuptemplates (userId, templateName, interactionType, daysAfter, messageSubject, messageBody, isActive)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        userId,
        templateName,
        interactionType,
        daysAfter,
        messageSubject || null,
        messageBody,
        isActive !== false,
      ],
    );

    const newTemplate = mapToTemplate(result.rows[0]);
    res.status(201).json(newTemplate);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Update a template
 */
const updateTemplate = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const template = req.body.template || req.body;

    await client.query("BEGIN");

    // Check ownership
    const checkResult = await client.query(
      "SELECT templateId FROM followuptemplates WHERE templateId = $1 AND userId = $2",
      [id, userId],
    );

    if (checkResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Template not found" });
    }

    const validation = validateTemplate(template);
    if (!validation.isValid) {
      await client.query("ROLLBACK");
      return res.status(400).json({ errors: validation.errors });
    }

    const {
      templateName,
      interactionType,
      daysAfter,
      messageSubject,
      messageBody,
      isActive,
    } = template;

    // Update the template
    const result = await client.query(
      `
      UPDATE followuptemplates
      SET templateName = $1, interactionType = $2, daysAfter = $3,
          messageSubject = $4, messageBody = $5, isActive = $6,
          updatedAt = NOW()
      WHERE templateId = $7 AND userId = $8
      RETURNING *
    `,
      [
        templateName,
        interactionType,
        daysAfter,
        messageSubject || null,
        messageBody,
        isActive !== false,
        id,
        userId,
      ],
    );

    // Get all pending follow-ups using this template
    const pendingFollowups = await client.query(
      `
      SELECT 
        f.followupId,
        f.interactionId,
        c.firstName as customerFirstName,
        c.lastName as customerLastName,
        i.interactionDate,
        COALESCE(pv.make, civ.make) as vehicleMake,
        COALESCE(pv.model, civ.model) as vehicleModel,
        COALESCE(pv.year, civ.year) as vehicleYear
      FROM followups f
      JOIN customers c ON f.customerId = c.customerId
      JOIN interactions i ON f.interactionId = i.interactionId
      LEFT JOIN purchasedvehicles pv ON pv.interactionId = f.interactionId
      LEFT JOIN customerinterestvehicles civ ON civ.interactionId = f.interactionId
      WHERE f.templateId = $1 
        AND f.userId = $2 
        AND f.status IN ('pending', 'sent')
    `,
      [id, userId],
    );

    // Update each pending follow-up with re-rendered template
    for (const followup of pendingFollowups.rows) {
      const daysElapsed = Math.floor(
        (new Date() - new Date(followup.interactiondate)) /
          (1000 * 60 * 60 * 24),
      );

      const templateData = {
        customerFirstName: followup.customerfirstname,
        customerLastName: followup.customerlastname,
        vehicleMake: followup.vehiclemake,
        vehicleModel: followup.vehiclemodel,
        vehicleYear: followup.vehicleyear,
        daysElapsed: daysElapsed.toString(),
      };

      const renderedSubject = renderTemplate(
        messageSubject || "",
        templateData,
      );
      const renderedBody = renderTemplate(messageBody, templateData);

      await client.query(
        `
        UPDATE followups
        SET messageSubject = $1, messageBody = $2
        WHERE followupId = $3
      `,
        [renderedSubject || null, renderedBody, followup.followupid],
      );
    }

    await client.query("COMMIT");

    const updatedTemplate = mapToTemplate(result.rows[0]);
    res.json({
      ...updatedTemplate,
      updatedFollowupsCount: pendingFollowups.rows.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};

/**
 * Delete a template
 */
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check ownership
    const checkResult = await pool.query(
      "SELECT templateId FROM followuptemplates WHERE templateId = $1 AND userId = $2",
      [id, userId],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Soft delete: set isActive to false
    await pool.query(
      "UPDATE followuptemplates SET isActive = false, updatedAt = NOW() WHERE templateId = $1 AND userId = $2",
      [id, userId],
    );

    res.json({ message: "Template deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get list of available template variables
 */
const getTemplateVariablesList = (req, res) => {
  try {
    const variables = getTemplateVariables();
    res.json({ variables });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ============================================
// FOLLOW-UP CONTROLLERS
// ============================================

/**
 * Get all follow-ups for the authenticated user
 */
const getAllFollowUps = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, scheduledDateFrom, scheduledDateTo, customerId } =
      req.query;

    let query = `
      SELECT f.*, 
             c.firstName as customerFirstName, 
             c.lastName as customerLastName, 
             c.preferredName as customerPreferredName,
             i.interactionType,
             v.make as vehicleMake,
             v.model as vehicleModel,
             v.year as vehicleYear
      FROM followups f
      JOIN customers c ON f.customerId = c.customerId
      JOIN interactions i ON f.interactionId = i.interactionId
      LEFT JOIN purchasedvehicles v ON i.interactionid = v.interactionid
      WHERE f.userId = $1
    `;
    const params = [userId];

    // Add filters if provided
    if (status) {
      params.push(status);
      query += ` AND f.status = $${params.length}`;
    }

    if (scheduledDateFrom) {
      params.push(scheduledDateFrom);
      query += ` AND f.scheduledDate >= $${params.length}`;
    }

    if (scheduledDateTo) {
      params.push(scheduledDateTo);
      query += ` AND f.scheduledDate <= $${params.length}`;
    }

    if (customerId) {
      params.push(customerId);
      query += ` AND f.customerId = $${params.length}`;
    }

    query += " ORDER BY f.scheduledDate ASC, f.createdAt ASC";

    const result = await pool.query(query, params);
    const followups = result.rows.map((row) => ({
      ...mapToFollowUp(row, true),
      interactionType: row.interactiontype,
      vehicleMake: row.vehiclemake,
      vehicleModel: row.vehiclemodel,
      vehicleYear: row.vehicleyear,
    }));

    res.json(followups);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get follow-up by id
 */
const getFollowUpById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `
      SELECT f.*, 
             c.firstName as customerFirstName, c.lastName as customerLastName, 
             c.preferredName as customerPreferredName, c.phoneNumber as customerPhoneNumber,
             c.email as customerEmail,
             i.interactionType, i.interactionDate, i.notes as interactionNotes,
             v.make as vehicleMake, v.model as vehicleModel, v.year as vehicleYear
      FROM followups f
      JOIN customers c ON f.customerId = c.customerId
      JOIN interactions i ON f.interactionId = i.interactionId
      LEFT JOIN purchasedvehicles v ON i.interactionid = v.interactionid
      WHERE f.followupId = $1 AND f.userId = $2
    `,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Follow-up not found" });
    }

    const row = result.rows[0];
    const followup = {
      ...mapToFollowUp(row, true),
      customerPhoneNumber: row.customerphonenumber,
      customerEmail: row.customeremail,
      interactionType: row.interactiontype,
      interactionDate: row.interactiondate,
      interactionNotes: row.interactionnotes,
      vehicleMake: row.vehiclemake,
      vehicleModel: row.vehiclemodel,
      vehicleYear: row.vehicleyear,
    };

    res.json(followup);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get upcoming follow-ups for the next N days (dashboard view)
 */
const getUpcomingFollowUps = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 3 } = req.query; // Default to 3 days

    const query = `
      SELECT f.*, 
             c.firstName as customerFirstName, 
             c.lastName as customerLastName, 
             c.preferredName as customerPreferredName,
             c.phoneNumber as customerPhoneNumber,
             c.email as customerEmail,
             i.interactionType,
             v.make as vehicleMake, 
             v.model as vehicleModel, 
             v.year as vehicleYear
      FROM followups f
      JOIN customers c ON f.customerId = c.customerId
      JOIN interactions i ON f.interactionId = i.interactionId
      LEFT JOIN purchasedvehicles v ON i.interactionid = v.interactionid
      WHERE f.userId = $1 
        AND f.status IN ('pending', 'sent')
        AND f.scheduledDate >= CURRENT_DATE
        AND f.scheduledDate <= CURRENT_DATE + INTERVAL '${parseInt(days)} days'
      ORDER BY f.scheduledDate ASC, c.lastName ASC, c.firstName ASC
    `;

    const result = await pool.query(query, [userId]);
    const followups = result.rows.map((row) => ({
      ...mapToFollowUp(row, true),
      customerPhoneNumber: row.customerphonenumber,
      customerEmail: row.customeremail,
      interactionType: row.interactiontype,
      vehicleMake: row.vehiclemake,
      vehicleModel: row.vehiclemodel,
      vehicleYear: row.vehicleyear,
    }));

    res.json(followups);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Mark follow-up as completed
 */
const completeFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const update = req.body;

    const validation = validateFollowUpUpdate(update, "complete");
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Check ownership
    const checkResult = await pool.query(
      "SELECT followupId FROM followups WHERE followupId = $1 AND userId = $2",
      [id, userId],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Follow-up not found" });
    }

    const completedDate = update.completedDate || new Date();
    const notes = update.notes || null;

    const result = await pool.query(
      `
      UPDATE followups
      SET status = 'completed', completedDate = $1, notes = $2
      WHERE followupId = $3 AND userId = $4
      RETURNING *
    `,
      [completedDate, notes, id, userId],
    );

    const updatedFollowUp = mapToFollowUp(result.rows[0]);
    res.json(updatedFollowUp);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Dismiss a follow-up
 */
const dismissFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check ownership
    const checkResult = await pool.query(
      "SELECT followupId FROM followups WHERE followupId = $1 AND userId = $2",
      [id, userId],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Follow-up not found" });
    }

    const result = await pool.query(
      `
      UPDATE followups
      SET status = 'dismissed'
      WHERE followupId = $1 AND userId = $2
      RETURNING *
    `,
      [id, userId],
    );

    const updatedFollowUp = mapToFollowUp(result.rows[0]);
    res.json(updatedFollowUp);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Snooze a follow-up to a new date
 */
const snoozeFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const update = req.body;

    const validation = validateFollowUpUpdate(update, "snooze");
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Check ownership
    const checkResult = await pool.query(
      "SELECT followupId FROM followups WHERE followupId = $1 AND userId = $2",
      [id, userId],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Follow-up not found" });
    }

    const result = await pool.query(
      `
      UPDATE followups
      SET status = 'snoozed', scheduledDate = $1
      WHERE followupId = $2 AND userId = $3
      RETURNING *
    `,
      [update.newScheduledDate, id, userId],
    );

    const updatedFollowUp = mapToFollowUp(result.rows[0]);
    res.json(updatedFollowUp);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Delete a follow-up
 */
const deleteFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check ownership
    const checkResult = await pool.query(
      "SELECT followupId FROM followups WHERE followupId = $1 AND userId = $2",
      [id, userId],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Follow-up not found" });
    }

    await pool.query(
      "DELETE FROM followups WHERE followupId = $1 AND userId = $2",
      [id, userId],
    );

    res.json({ message: "Follow-up deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Manually send digest email for today's pending follow-ups
 */
const sendDigestNow = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = req.user.email;

    // Fetch user's firstName from database
    const userResult = await pool.query(
      "SELECT firstName FROM users WHERE userId = $1",
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userFirstName = userResult.rows[0].firstname;

    const result = await sendManualDigest(userId, userEmail, userFirstName);

    if (result.success) {
      res.json({
        message: result.message,
        followupCount: result.followupCount,
      });
    } else {
      res.status(404).json({
        message: result.message,
        followupCount: result.followupCount,
      });
    }
  } catch (err) {
    console.error("Error sending manual digest:", err.message);
    res.status(500).json({ error: "Failed to send digest email" });
  }
};

module.exports = {
  // Template controllers
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateVariablesList,
  // Follow-up controllers
  getAllFollowUps,
  getFollowUpById,
  getUpcomingFollowUps,
  completeFollowUp,
  dismissFollowUp,
  snoozeFollowUp,
  deleteFollowUp,
  sendDigestNow,
};
