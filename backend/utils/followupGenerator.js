// Helper function for generating follow-ups when a vehicle is created
const { mapToTemplate } = require("../models/template.model");
const { mapToFollowUp, renderTemplate } = require("../models/followup.model");

/**
 * Generate follow-ups for a vehicle associated with an interaction
 * @param {Object} client - Database client (for transaction)
 * @param {Object} params - Parameters object
 * @param {number} params.userId - User ID
 * @param {number} params.customerId - Customer ID
 * @param {number} params.interactionId - Interaction ID
 * @param {string} params.interactionType - Type of interaction
 * @param {string} params.interactionDate - Date of interaction
 * @param {string} params.vehicleMake - Vehicle make
 * @param {string} params.vehicleModel - Vehicle model
 * @param {string|number} params.vehicleYear - Vehicle year
 * @returns {Promise<Array>} Array of generated follow-ups
 */
const generateFollowupsForVehicle = async (client, params) => {
  const {
    userId,
    customerId,
    interactionId,
    interactionType,
    interactionDate,
    vehicleMake = "",
    vehicleModel = "",
    vehicleYear = "",
  } = params;

  console.log("generateFollowupsForVehicle called with params:", params);

  const generatedFollowups = [];

  // Get matching templates for this interaction type
  const templatesResult = await client.query(
    `
    SELECT * FROM followuptemplates
    WHERE userId = $1 AND interactionType = $2 AND isActive = true
  `,
    [userId, interactionType],
  );

  if (templatesResult.rows.length > 0) {
    // Get customer data for template rendering
    const dataResult = await client.query(
      `
      SELECT u.firstname as userfirst, u.lastname as userlast, c.firstName, c.lastName, c.preferredName
      FROM customers c
	  INNER JOIN users u
	  ON u.userid = c.userid
      WHERE c.customerId = $1
    `,
      [customerId],
    );

    const data = dataResult.rows[0] || {};
    const templateData = {
      userFirstName: data.userfirst,
      userLastName: data.userlast,
      customerFirstName: data.firstname,
      customerLastName: data.lastname,
      customerPreferredName: data.preferredname,
      vehicleMake: vehicleMake || "",
      vehicleModel: vehicleModel || "",
      vehicleYear: vehicleYear ? String(vehicleYear) : "",
      interactionDate:
        interactionDate || new Date().toISOString().split("T")[0],
      daysElapsed: "", // Will be calculated later
    };

    console.log("Template data for follow-up generation:", templateData);

    // Generate follow-ups for each template
    for (const templateRow of templatesResult.rows) {
      const template = mapToTemplate(templateRow);

      // Calculate scheduled date
      const baseDate = new Date(interactionDate || new Date());
      const scheduledDate = new Date(baseDate);
      scheduledDate.setDate(scheduledDate.getDate() + template.daysAfter);

      // Render template
      const renderedSubject = template.messageSubject
        ? renderTemplate(template.messageSubject, templateData)
        : null;
      const renderedBody = renderTemplate(template.messageBody, templateData);

      // Insert follow-up
      const followupResult = await client.query(
        `
        INSERT INTO followups (userId, customerId, interactionId, templateId, scheduledDate, status, messageSubject, messageBody)
        VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
        RETURNING *
      `,
        [
          userId,
          customerId,
          interactionId,
          template.templateId,
          scheduledDate,
          renderedSubject,
          renderedBody,
        ],
      );

      generatedFollowups.push(mapToFollowUp(followupResult.rows[0]));
    }
  }

  return generatedFollowups;
};

/**
 * Regenerate follow-ups for an interaction by deleting pending/sent ones and creating new ones
 * @param {Object} client - Database client (for transaction)
 * @param {number} interactionId - Interaction ID
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of regenerated follow-ups
 */
const regenerateFollowupsForInteraction = async (client, interactionId, userId) => {
  console.log(`Regenerating follow-ups for interaction ${interactionId}`);

  // Get interaction details
  const interactionResult = await client.query(
    `SELECT i.*, c.customerId 
     FROM interactions i
     JOIN customers c ON i.customerId = c.customerId
     WHERE i.interactionId = $1 AND i.userId = $2`,
    [interactionId, userId]
  );

  if (interactionResult.rows.length === 0) {
    console.log(`Interaction ${interactionId} not found`);
    return [];
  }

  const interaction = interactionResult.rows[0];

  // Delete existing pending and sent follow-ups for this interaction
  const deleteResult = await client.query(
    `DELETE FROM followups 
     WHERE interactionId = $1 AND userId = $2 AND status IN ('pending', 'sent')
     RETURNING followupId`,
    [interactionId, userId]
  );

  console.log(`Deleted ${deleteResult.rowCount} pending/sent follow-ups for interaction ${interactionId}`);

  // Get vehicle info if it exists (check both purchased vehicles and interest vehicles)
  const vehicleResult = await client.query(
    `SELECT make, model, year FROM purchasedvehicles 
     WHERE interactionId = $1
     UNION ALL
     SELECT make, model, year FROM customerinterestvehicles 
     WHERE interactionId = $1
     LIMIT 1`,
    [interactionId]
  );

  const vehicle = vehicleResult.rows[0] || {};

  // Regenerate follow-ups
  const newFollowups = await generateFollowupsForVehicle(client, {
    userId,
    customerId: interaction.customerid,
    interactionId,
    interactionType: interaction.interactiontype,
    interactionDate: interaction.interactiondate,
    vehicleMake: vehicle.make || '',
    vehicleModel: vehicle.model || '',
    vehicleYear: vehicle.year || '',
  });

  console.log(`Regenerated ${newFollowups.length} follow-ups for interaction ${interactionId}`);
  return newFollowups;
};

/**
 * Regenerate follow-ups for all interactions of a customer
 * @param {Object} client - Database client (for transaction)
 * @param {number} customerId - Customer ID
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of interactions processed
 */
const regenerateFollowupsForCustomer = async (client, customerId, userId) => {
  console.log(`Regenerating follow-ups for customer ${customerId}`);

  // Get all interactions for this customer
  const interactionsResult = await client.query(
    `SELECT interactionId FROM interactions 
     WHERE customerId = $1 AND userId = $2`,
    [customerId, userId]
  );

  let count = 0;
  for (const row of interactionsResult.rows) {
    await regenerateFollowupsForInteraction(client, row.interactionid, userId);
    count++;
  }

  console.log(`Regenerated follow-ups for ${count} interactions for customer ${customerId}`);
  return count;
};

module.exports = {
  generateFollowupsForVehicle,
  regenerateFollowupsForInteraction,
  regenerateFollowupsForCustomer,
};
