// Follow-up Template model definition, mapping, and validation functions

/**
 * Maps a database row to a FollowUpTemplate object
 * @param {Object} row - Database row from followuptemplates table
 * @returns {Object} FollowUpTemplate object with camelCase properties
 */
const mapToTemplate = (row) => {
  return {
    templateId: row.templateid,
    userId: row.userid,
    templateName: row.templatename,
    interactionType: row.interactiontype,
    daysAfter: row.daysafter,
    messageSubject: row.messagesubject,
    messageBody: row.messagebody,
    isActive: row.isactive,
    createdAt: row.createdat,
    updatedAt: row.updatedat
  };
};

/**
 * Validates a FollowUpTemplate object
 * @param {Object} template - Template object to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateTemplate = (template) => {
  const errors = [];
  
  if (!template) {
    return { isValid: false, errors: ['Template object is required'] };
  }
  
  if (!template.templateName || template.templateName.trim() === '') {
    errors.push('Template name is required');
  }
  
  if (!template.interactionType || template.interactionType.trim() === '') {
    errors.push('Interaction type is required');
  }
  
  // Validate interaction type is one of the allowed values
  const validTypes = ['purchase', 'interest', 'test_drive', 'general_inquiry'];
  if (template.interactionType && !validTypes.includes(template.interactionType.toLowerCase())) {
    errors.push(`Interaction type must be one of: ${validTypes.join(', ')}`);
  }
  
  if (!template.daysAfter || typeof template.daysAfter !== 'number') {
    errors.push('Days after is required and must be a number');
  } else if (template.daysAfter <= 0) {
    errors.push('Days after must be greater than 0');
  }
  
  if (!template.messageBody || template.messageBody.trim() === '') {
    errors.push('Message body is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get available template variables for dynamic content
 * @returns {Array} Array of variable objects with name, description, and example
 */
const getTemplateVariables = () => {
  return [
    {
      name: '{{customerFirstName}}',
      description: 'Customer\'s first name',
      example: 'John'
    },
    {
      name: '{{customerLastName}}',
      description: 'Customer\'s last name',
      example: 'Doe'
    },
    {
      name: '{{customerPreferredName}}',
      description: 'Customer\'s preferred name (if set)',
      example: 'Johnny'
    },
    {
      name: '{{vehicleMake}}',
      description: 'Vehicle make',
      example: 'Toyota'
    },
    {
      name: '{{vehicleModel}}',
      description: 'Vehicle model',
      example: 'Camry'
    },
    {
      name: '{{vehicleYear}}',
      description: 'Vehicle year',
      example: '2024'
    },
    {
      name: '{{interactionDate}}',
      description: 'Date of the interaction',
      example: '2026-01-15'
    },
    {
      name: '{{daysElapsed}}',
      description: 'Number of days since interaction',
      example: '30'
    }
  ];
};

module.exports = {
  mapToTemplate,
  validateTemplate,
  getTemplateVariables
};
