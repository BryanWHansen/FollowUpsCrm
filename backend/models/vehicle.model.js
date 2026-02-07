// Vehicle model definition and mapping functions

/**
 * Maps a database row to a Vehicle object
 * @param {Object} row - Database row from purchasedvehicles table
 * @param {boolean} includeCustomerInfo - Whether to include customer first/last name
 * @returns {Object} Vehicle object with camelCase properties
 */
const mapToVehicle = (row, includeCustomerInfo = false) => {
  const vehicle = {
    vehicleId: row.vehicleid,
    userId: row.userid,
    customerId: row.customerid,
    interactionId: row.interactionid,
    make: row.make,
    model: row.model,
    year: row.year,
    purchaseDate: row.purchasedate,
    salePrice: row.saleprice,
    vin: row.vin,
    color: row.color,
    mileage: row.mileage,
    notes: row.notes,
    createdAt: row.createdat,
    updatedAt: row.updatedat
  };
  
  if (includeCustomerInfo && row.firstname && row.lastname) {
    vehicle.customerFirstName = row.firstname;
    vehicle.customerLastName = row.lastname;
  }
  
  return vehicle;
};

/**
 * Validates a Vehicle object
 * @param {Object} vehicle - Vehicle object to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateVehicle = (vehicle) => {
  const errors = [];
  
  if (!vehicle) {
    return { isValid: false, errors: ['Vehicle object is required'] };
  }
  
  if (!vehicle.customerId) {
    errors.push('Customer ID is required');
  }
  
  if (!vehicle.make || vehicle.make.trim() === '') {
    errors.push('Make is required');
  }
  
  if (!vehicle.model || vehicle.model.trim() === '') {
    errors.push('Model is required');
  }
  
  if (!vehicle.year || typeof vehicle.year !== 'number') {
    errors.push('Year is required and must be a number');
  }
  
  if (vehicle.interactionId && typeof vehicle.interactionId !== 'number') {
    errors.push('Interaction ID must be a valid number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  mapToVehicle,
  validateVehicle
};
