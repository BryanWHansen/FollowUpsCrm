// Customer model definition and mapping functions

/**
 * Maps a database row to a Customer object
 * @param {Object} row - Database row from customers table
 * @returns {Object} Customer object with camelCase properties
 */
const mapToCustomer = (row) => {
  return {
    customerId: row.customerid,
    userId: row.userid,
    firstName: row.firstname,
    lastName: row.lastname,
    preferredName: row.preferredname,
    birthday: row.birthday,
    phoneNumber: row.phonenumber,
    address: row.address,
    email: row.email,
    notes: row.notes,
    customerStatus: row.customerstatus,
    lastContactDate: row.lastcontactdate,
    createdAt: row.createdat,
    updatedAt: row.updatedat,
  };
};

/**
 * Validates a Customer object
 * @param {Object} customer - Customer object to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateCustomer = (customer) => {
  const errors = [];

  if (!customer) {
    return { isValid: false, errors: ["Customer object is required"] };
  }

  console.log("Validating customer:", JSON.stringify(customer, null, 2));
  console.log(
    "firstName:",
    customer.firstName,
    "Type:",
    typeof customer.firstName,
  );
  console.log(
    "lastName:",
    customer.lastName,
    "Type:",
    typeof customer.lastName,
  );

  if (!customer.firstName || customer.firstName.trim() === "") {
    errors.push("First name is required");
  }

  if (!customer.lastName || customer.lastName.trim() === "") {
    errors.push("Last name is required");
  }

  // Validate customerStatus if provided
  if (
    customer.customerStatus &&
    !["lead", "customer"].includes(customer.customerStatus)
  ) {
    errors.push('Customer status must be either "lead" or "customer"');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  mapToCustomer,
  validateCustomer,
};
