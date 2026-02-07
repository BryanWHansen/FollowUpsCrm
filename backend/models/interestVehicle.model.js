// Customer Interest Vehicle model definition, mapping, and validation functions

/**
 * Maps a database row to an InterestVehicle object
 * @param {Object} row - Database row from customerInterestVehicles table
 * @returns {Object} InterestVehicle object with camelCase properties
 */
const mapToInterestVehicle = (row) => {
  return {
    interestVehicleId: row.interestvehicleid,
    userId: row.userid,
    customerId: row.customerid,
    interactionId: row.interactionid,
    make: row.make,
    model: row.model,
    year: row.year,
    color: row.color,
    trim: row.trim,
    vehicleType: row.vehicletype,
    notes: row.notes,
    createdAt: row.createdat,
    updatedAt: row.updatedat
  };
};

/**
 * Validates an InterestVehicle object
 * @param {Object} interestVehicle - InterestVehicle object to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateInterestVehicle = (interestVehicle) => {
  const errors = [];
  
  if (!interestVehicle) {
    return { isValid: false, errors: ['Interest vehicle object is required'] };
  }
  
  if (!interestVehicle.customerId) {
    errors.push('Customer ID is required');
  }
  
  if (!interestVehicle.interactionId) {
    errors.push('Interaction ID is required');
  }
  
  // At least one field should be specified to describe the interest
  const hasAnyVehicleInfo = interestVehicle.make || 
                            interestVehicle.model || 
                            interestVehicle.year || 
                            interestVehicle.color || 
                            interestVehicle.trim || 
                            interestVehicle.vehicleType;
  
  if (!hasAnyVehicleInfo) {
    errors.push('At least one vehicle attribute (make, model, year, color, trim, or vehicleType) is required');
  }
  
  // Validate year if provided
  if (interestVehicle.year) {
    const year = parseInt(interestVehicle.year);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear + 2) {
      errors.push(`Year must be between 1900 and ${currentYear + 2}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Formats an InterestVehicle for display
 * Returns a human-readable string like "White GMC Acadia" or "2025 Black Pickup"
 */
const formatInterestVehicleDescription = (vehicle) => {
  const parts = [];
  
  if (vehicle.year) parts.push(vehicle.year);
  if (vehicle.color) parts.push(vehicle.color);
  if (vehicle.make) parts.push(vehicle.make);
  if (vehicle.model) parts.push(vehicle.model);
  if (vehicle.trim) parts.push(vehicle.trim);
  if (vehicle.vehicleType && !vehicle.make && !vehicle.model) {
    // Only show vehicleType if no make/model specified
    parts.push(vehicle.vehicleType);
  }
  
  return parts.length > 0 ? parts.join(' ') : 'Vehicle';
};

module.exports = {
  mapToInterestVehicle,
  validateInterestVehicle,
  formatInterestVehicleDescription
};
