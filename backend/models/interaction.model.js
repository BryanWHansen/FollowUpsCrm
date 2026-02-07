// Interaction model definition, mapping, and validation functions

/**
 * Maps a database row to an Interaction object
 * @param {Object} row - Database row from interactions table
 * @returns {Object} Interaction object with camelCase properties
 */
const mapToInteraction = (row) => {
  return {
    interactionId: row.interactionid,
    userId: row.userid,
    customerId: row.customerid,
    interactionType: row.interactiontype,
    interactionDate: row.interactiondate,
    notes: row.notes,
    createdAt: row.createdat
  };
};

/**
 * Validates an Interaction object
 * @param {Object} interaction - Interaction object to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateInteraction = (interaction) => {
  const errors = [];
  
  if (!interaction) {
    return { isValid: false, errors: ['Interaction object is required'] };
  }
  
  if (!interaction.customerId) {
    errors.push('Customer ID is required');
  }
  
  if (!interaction.interactionType || interaction.interactionType.trim() === '') {
    errors.push('Interaction type is required');
  }
  
  // Validate interaction type is one of the allowed values
  const validTypes = ['purchase', 'interest', 'test_drive', 'general_inquiry'];
  if (interaction.interactionType && !validTypes.includes(interaction.interactionType.toLowerCase())) {
    errors.push(`Interaction type must be one of: ${validTypes.join(', ')}`);
  }
  
  // Validate interaction date if provided
  if (interaction.interactionDate) {
    const date = new Date(interaction.interactionDate);
    if (isNaN(date.getTime())) {
      errors.push('Invalid interaction date format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  mapToInteraction,
  validateInteraction
};
