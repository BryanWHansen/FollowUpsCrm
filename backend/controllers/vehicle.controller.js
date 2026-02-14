// Vehicle controller - handles all vehicle-related business logic
const pool = require("../db");
const { mapToVehicle, validateVehicle } = require("../models/vehicle.model");
const {
  generateFollowupsForVehicle,
  regenerateFollowupsForInteraction,
} = require("../utils/followupGenerator");

/**
 * Get all vehicles for the authenticated user
 */
const getAllVehicles = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `
      SELECT pv.*, c.firstName, c.lastName 
      FROM purchasedvehicles pv
      JOIN customers c ON pv.customerid = c.customerid
      WHERE pv.userId = $1
      ORDER BY pv.vehicleid
    `,
      [userId],
    );
    const vehicles = result.rows.map((row) => mapToVehicle(row, true));
    res.json(vehicles);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get vehicles by customer id
 */
const getVehiclesByCustomerId = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // First verify the customer belongs to the user
    const customerCheck = await pool.query(
      "SELECT customerid FROM customers WHERE customerid = $1 AND userId = $2",
      [id, userId],
    );

    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Get vehicles for this customer, filtered by userId for extra security
    const result = await pool.query(
      "SELECT * FROM purchasedvehicles WHERE customerid = $1 AND userId = $2 ORDER BY vehicleid",
      [id, userId],
    );
    const vehicles = result.rows.map(mapToVehicle);
    res.json(vehicles);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Create a new vehicle and auto-generate follow-ups
 */
const createVehicle = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.userId;

    // Accept both { vehicle: {...} } and direct properties
    const vehicle = req.body.vehicle || req.body;

    const validation = validateVehicle(vehicle);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const {
      customerId,
      interactionId,
      make,
      model,
      year,
      purchaseDate,
      salePrice,
      vin,
      color,
      mileage,
      notes,
    } = vehicle;

    // Check if customer exists AND belongs to this user
    const customerCheck = await client.query(
      "SELECT customerid FROM customers WHERE customerid = $1 AND userId = $2",
      [customerId, userId],
    );
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // If interactionId is provided, verify it exists and belongs to the same customer/user
    let interactionType = null;
    let interactionDate = null;
    if (interactionId) {
      const interactionCheck = await client.query(
        "SELECT interactionid, interactiontype, interactiondate FROM interactions WHERE interactionid = $1 AND customerid = $2 AND userid = $3",
        [interactionId, customerId, userId],
      );
      if (interactionCheck.rows.length === 0) {
        return res.status(404).json({
          error: "Interaction not found or does not belong to this customer",
        });
      }
      interactionType = interactionCheck.rows[0].interactiontype;
      interactionDate = interactionCheck.rows[0].interactiondate;
    }

    await client.query("BEGIN");

    // Ensure purchaseDate is in YYYY-MM-DD format (no timezone conversion)
    let purchaseDateToStore = purchaseDate;
    if (purchaseDate && typeof purchaseDate === "string") {
      purchaseDateToStore = purchaseDate.split("T")[0];
    }

    const result = await client.query(
      `INSERT INTO purchasedvehicles (userId, customerId, interactionId, make, model, year, purchaseDate, salePrice, vin, color, mileage, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [
        userId,
        customerId,
        interactionId || null,
        make,
        model,
        year,
        purchaseDateToStore || null,
        salePrice || null,
        vin || null,
        color || null,
        mileage || null,
        notes || null,
      ],
    );

    const newVehicle = mapToVehicle(result.rows[0]);
    const generatedFollowups = [];

    // Generate follow-ups if vehicle is associated with an interaction
    if (interactionId && interactionType) {
      const followups = await generateFollowupsForVehicle(client, {
        userId,
        customerId,
        interactionId,
        interactionType,
        interactionDate,
        vehicleMake: make || "",
        vehicleModel: model || "",
        vehicleYear: year || "",
      });
      generatedFollowups.push(...followups);
    }

    await client.query("COMMIT");

    res.status(201).json({
      vehicle: newVehicle,
      generatedFollowups,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};

/**
 * Delete a vehicle
 */
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      "DELETE FROM purchasedvehicles WHERE vehicleid = $1 AND userid = $2 RETURNING *",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Update a vehicle
 */
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const vehicle = req.body.vehicle || req.body;

    const validation = validateVehicle(vehicle);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const {
      customerId,
      interactionId,
      make,
      model,
      year,
      purchaseDate,
      salePrice,
      vin,
      color,
      mileage,
      notes,
    } = vehicle;

    // Check if vehicle exists and belongs to this user
    const vehicleCheck = await pool.query(
      "SELECT vehicleid FROM purchasedvehicles WHERE vehicleid = $1 AND userid = $2",
      [id, userId],
    );
    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    // Check if customer exists AND belongs to this user
    const customerCheck = await pool.query(
      "SELECT customerid FROM customers WHERE customerid = $1 AND userId = $2",
      [customerId, userId],
    );
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // If interactionId is provided, verify it exists and belongs to the same customer/user
    if (interactionId) {
      const interactionCheck = await pool.query(
        "SELECT interactionid FROM interactions WHERE interactionid = $1 AND customerid = $2 AND userid = $3",
        [interactionId, customerId, userId],
      );
      if (interactionCheck.rows.length === 0) {
        return res.status(404).json({
          error: "Interaction not found or does not belong to this customer",
        });
      }
    }

    const client = await pool.connect();
    await client.query("BEGIN");

    // Ensure purchaseDate is in YYYY-MM-DD format (no timezone conversion)
    let purchaseDateToStore = purchaseDate;
    if (purchaseDate && typeof purchaseDate === "string") {
      purchaseDateToStore = purchaseDate.split("T")[0];
    }

    const result = await client.query(
      `UPDATE purchasedvehicles 
       SET customerid = $1, interactionid = $2, make = $3, model = $4, year = $5, 
           purchasedate = $6::date, saleprice = $7, vin = $8, color = $9, mileage = $10, notes = $11
       WHERE vehicleid = $12 AND userid = $13
       RETURNING *`,
      [
        customerId,
        interactionId || null,
        make,
        model,
        year,
        purchaseDateToStore || null,
        salePrice || null,
        vin || null,
        color || null,
        mileage || null,
        notes || null,
        id,
        userId,
      ],
    );

    // Regenerate follow-ups if vehicle has an interaction
    if (interactionId) {
      await regenerateFollowupsForInteraction(client, interactionId, userId);
    }

    await client.query("COMMIT");
    client.release();

    const updatedVehicle = mapToVehicle(result.rows[0]);
    res.json(updatedVehicle);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getAllVehicles,
  getVehiclesByCustomerId,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
