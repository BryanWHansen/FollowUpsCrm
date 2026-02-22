// Follow-up model definition, mapping, and validation functions

/**
 * Maps a database row to a FollowUp object
 * @param {Object} row - Database row from followups table
 * @param {boolean} includeCustomerInfo - Whether to include customer details
 * @returns {Object} FollowUp object with camelCase properties
 */
const mapToFollowUp = (row, includeCustomerInfo = false) => {
  const followUp = {
    followupId: row.followupid,
    userId: row.userid,
    customerId: row.customerid,
    interactionId: row.interactionid,
    templateId: row.templateid,
    scheduledDate: row.scheduleddate,
    completedDate: row.completeddate,
    status: row.status,
    messageSubject: row.messagesubject,
    messageBody: row.messagebody,
    notes: row.notes,
    createdAt: row.createdat,
  };

  // Include customer info if requested and available
  if (includeCustomerInfo) {
    if (row.customerfirstname)
      followUp.customerFirstName = row.customerfirstname;
    if (row.customerlastname) followUp.customerLastName = row.customerlastname;
    if (row.customerpreferredname)
      followUp.customerPreferredName = row.customerpreferredname;
  }

  return followUp;
};

/**
 * Validates a FollowUp update object (for completing, dismissing, snoozing)
 * @param {Object} update - Update object to validate
 * @param {string} action - Action being performed: 'complete', 'dismiss', 'snooze'
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateFollowUpUpdate = (update, action) => {
  const errors = [];

  if (!update) {
    return { isValid: false, errors: ["Update object is required"] };
  }

  if (action === "complete") {
    // For completing, completedDate is optional (defaults to today)
    if (update.completedDate) {
      const date = new Date(update.completedDate);
      if (isNaN(date.getTime())) {
        errors.push("Invalid completed date format");
      }
    }
  }

  if (action === "snooze") {
    if (!update.newScheduledDate) {
      errors.push("New scheduled date is required for snoozing");
    } else {
      const date = new Date(update.newScheduledDate);
      if (isNaN(date.getTime())) {
        errors.push("Invalid scheduled date format");
      } else if (date < new Date()) {
        errors.push("New scheduled date must be in the future");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Renders a template with actual data
 * @param {string} template - Template string with variables
 * @param {Object} data - Data object containing variable values
 * @returns {string} Rendered template with replaced variables
 */
const renderTemplate = (template, data) => {
  if (!template) return "";

  let rendered = template;

  // Replace all template variables
  rendered = rendered.replace(
    /\{\{userFirstName\}\}/g,
    data.userFirstName || "",
  );
  rendered = rendered.replace(/\{\{userLastName\}\}/g, data.userLastName || "");
  rendered = rendered.replace(
    /\{\{customerFirstName\}\}/g,
    data.customerPreferredName || data.customerFirstName || "",
  );
  rendered = rendered.replace(
    /\{\{customerLastName\}\}/g,
    data.customerLastName || "",
  );
  rendered = rendered.replace(
    /\{\{customerPreferredName\}\}/g,
    data.customerPreferredName || data.customerFirstName || "",
  );
  rendered = rendered.replace(/\{\{vehicleMake\}\}/g, data.vehicleMake || "");
  rendered = rendered.replace(/\{\{vehicleModel\}\}/g, data.vehicleModel || "");
  rendered = rendered.replace(/\{\{vehicleYear\}\}/g, data.vehicleYear || "");
  rendered = rendered.replace(
    /\{\{interactionDate\}\}/g,
    data.interactionDate || "",
  );
  rendered = rendered.replace(/\{\{daysElapsed\}\}/g, data.daysElapsed || "");

  return rendered;
};

module.exports = {
  mapToFollowUp,
  validateFollowUpUpdate,
  renderTemplate,
};
