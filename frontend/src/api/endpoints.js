import api from "./axios";

// Auth API
export const authAPI = {
  register: (userData) => api.post("/api/auth/register", userData),
  login: (credentials) => api.post("/api/auth/login", credentials),
  logout: () => api.post("/api/auth/logout"),
  getCurrentUser: () => api.get("/api/auth/me"),
  changePassword: (passwordData) =>
    api.put("/api/auth/change-password", passwordData),
};

// Customer API
export const customerAPI = {
  getAll: () => api.get("/api/customers"),
  getById: (id) => api.get(`/api/customers/${id}`),
  create: (customer) => api.post("/api/customers", customer),
  update: (id, customer) => api.put(`/api/customers/${id}`, customer),
  delete: (id) => api.delete(`/api/customers/${id}`),
};

// Vehicle API
export const vehicleAPI = {
  getAll: () => api.get("/api/vehicles"),
  getByCustomerId: (customerId) =>
    api.get(`/api/customers/${customerId}/vehicles`),
  create: (vehicle) => api.post("/api/vehicles", vehicle),
  update: (id, vehicle) => api.put(`/api/vehicles/${id}`, vehicle),
  delete: (id) => api.delete(`/api/vehicles/${id}`),
};

// Interaction API
export const interactionAPI = {
  getAll: (params) => api.get("/api/interactions", { params }),
  getById: (id) => api.get(`/api/interactions/${id}`),
  getWithoutVehicles: () => api.get("/api/interactions/without-vehicles"),
  getTypesWithoutTemplates: () =>
    api.get("/api/interactions/types-without-templates"),
  create: (interaction) => api.post("/api/interactions", interaction),
  update: (id, interaction) => api.put(`/api/interactions/${id}`, interaction),
  delete: (id) => api.delete(`/api/interactions/${id}`),
};

// Template API
export const templateAPI = {
  getAll: (params) => api.get("/api/followups/templates", { params }),
  getById: (id) => api.get(`/api/followups/templates/${id}`),
  getVariables: () => api.get("/api/followups/templates/variables"),
  create: (template) => api.post("/api/followups/templates", template),
  update: (id, template) => api.put(`/api/followups/templates/${id}`, template),
  delete: (id) => api.delete(`/api/followups/templates/${id}`),
};

// Follow-up API
export const followupAPI = {
  getAll: (params) => api.get("/api/followups", { params }),
  getById: (id) => api.get(`/api/followups/${id}`),
  getUpcoming: (days = 3) =>
    api.get("/api/followups/upcoming", { params: { days } }),
  complete: (id, data) => api.put(`/api/followups/${id}/complete`, data),
  dismiss: (id) => api.put(`/api/followups/${id}/dismiss`),
  snooze: (id, data) => api.put(`/api/followups/${id}/snooze`, data),
  delete: (id) => api.delete(`/api/followups/${id}`),
  sendDigest: () => api.post("/api/followups/send-digest"),
};

// Interest Vehicle API
export const interestVehicleAPI = {
  getAll: () => api.get("/api/interest-vehicles"),
  getByCustomerId: (customerId) =>
    api.get(`/api/interest-vehicles/customer/${customerId}`),
  create: (interestVehicle) =>
    api.post("/api/interest-vehicles", interestVehicle),
  update: (id, interestVehicle) =>
    api.put(`/api/interest-vehicles/${id}`, interestVehicle),
  delete: (id) => api.delete(`/api/interest-vehicles/${id}`),
};

// User Profile & Preferences
export const userPreferencesAPI = {
  getProfile: () => api.get("/api/auth/profile"),
  updateUser: (userData) => api.put("/api/auth/me", userData),
  updateEmailPreferences: (preferences) =>
    api.patch("/api/auth/email-preferences", preferences),
  deleteAccount: (password) =>
    api.delete("/api/auth/account", { data: { password } }),
};
