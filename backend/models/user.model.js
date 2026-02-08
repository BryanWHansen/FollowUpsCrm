// User model definition, mapping, and validation functions

/**
 * Maps a database row to a User object
 * @param {Object} row - Database row from users table
 * @returns {Object} User object with camelCase properties (excludes passwordHash)
 */
const mapToUser = (row) => {
  return {
    userId: row.userid,
    email: row.email,
    firstName: row.firstname,
    lastName: row.lastname,
    createdAt: row.createdat,
    lastLogin: row.lastlogin,
  };
};

/**
 * Validates a User registration object
 * @param {Object} user - User object to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateUserRegistration = (user) => {
  const errors = [];

  if (!user) {
    return { isValid: false, errors: ["User object is required"] };
  }

  // Email validation
  if (!user.email || user.email.trim() === "") {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      errors.push("Invalid email format");
    }
  }

  // Password validation
  if (!user.password || user.password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  // First name validation
  if (!user.firstName || user.firstName.trim() === "") {
    errors.push("First name is required");
  }

  // Last name validation
  if (!user.lastName || user.lastName.trim() === "") {
    errors.push("Last name is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates a User login object
 * @param {Object} credentials - Login credentials to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateUserLogin = (credentials) => {
  const errors = [];

  if (!credentials) {
    return { isValid: false, errors: ["Credentials are required"] };
  }

  if (!credentials.email || credentials.email.trim() === "") {
    errors.push("Email is required");
  }

  if (!credentials.password || credentials.password === "") {
    errors.push("Password is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  mapToUser,
  validateUserRegistration,
  validateUserLogin,
  validateEmailDigestTime(time) {
    if (!time) return true; // Optional field

    // Validate HH:MM format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
  },

  validateTimezone(timezone) {
    if (!timezone) return true; // Optional field

    // Common IANA timezones
    const validTimezones = [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Phoenix",
      "America/Anchorage",
      "Pacific/Honolulu",
      "Europe/London",
      "Europe/Paris",
      "Asia/Tokyo",
      "Australia/Sydney",
    ];

    return validTimezones.includes(timezone);
  },
};
