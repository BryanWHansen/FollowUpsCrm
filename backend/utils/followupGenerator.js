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

module.exports = {
  generateFollowupsForVehicle,
};
