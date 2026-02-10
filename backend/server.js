const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require("./routes/auth.routes");
const customerRoutes = require("./routes/customer.routes");
const vehicleRoutes = require("./routes/vehicle.routes");
const interactionRoutes = require("./routes/interaction.routes");
const interestVehicleRoutes = require("./routes/interestVehicle.routes");
const followupRoutes = require("./routes/followup.routes");

// Import scheduler
const { initializeScheduler } = require("./scheduler/dailyDigest");
const { testEmailConfig } = require("./services/emailService");

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/interest-vehicles", interestVehicleRoutes);
app.use("/api/followups", followupRoutes);

// Special route: Get vehicles by customer id (nested resource)
const vehicleController = require("./controllers/vehicle.controller");
const { authenticateToken } = require("./middleware/auth.middleware");
app.get(
  "/api/customers/:id/vehicles",
  authenticateToken,
  vehicleController.getVehiclesByCustomerId,
);

// Test email configuration on startup
testEmailConfig().then((isValid) => {
  if (isValid) {
    // Initialize daily digest scheduler
    initializeScheduler();
  } else {
    console.warn("⚠️  Email not configured - daily digests disabled");
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
