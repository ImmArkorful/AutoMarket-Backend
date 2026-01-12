const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/auth");
require("./user-swagger");

// GET /profile - Get user profile (protected)
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user profile
    const userResult = await db.query(
      "SELECT id, email, name, phone, created_at, updated_at FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = userResult.rows[0];

    // Get user stats
    const [listingsCount, favoritesCount] = await Promise.all([
      db.query("SELECT COUNT(*) FROM cars WHERE seller_id = $1", [userId]),
      db.query("SELECT COUNT(*) FROM favorites WHERE user_id = $1", [userId]),
    ]);

    const stats = {
      total_listings: parseInt(listingsCount.rows[0].count),
      total_favorites: parseInt(favoritesCount.rows[0].count),
    };

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      stats,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
});

// PUT /profile - Update user profile (protected)
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone } = req.body;

    // Build UPDATE query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name || null);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      updateValues.push(phone || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update." });
    }

    // Add updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, email, name, phone, created_at, updated_at
    `;

    const result = await db.query(updateQuery, updateValues);

    const updatedUser = result.rows[0];
    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile." });
  }
});

// GET /favorites - Get user's favorite cars (protected)
router.get("/favorites", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db.query(
      "SELECT COUNT(*) FROM favorites WHERE user_id = $1",
      [userId]
    );
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get favorites with car details
    const result = await db.query(
      `
      SELECT 
        f.id as favorite_id,
        f.created_at as favorited_at,
        c.id,
        c.seller_id,
        c.make,
        c.model,
        c.year,
        c.price,
        c.body_type,
        c.fuel_type,
        c.transmission,
        c.engine,
        c.color,
        c.doors,
        c.co2_emissions,
        c.description,
        c.image_urls,
        c.status,
        c.created_at,
        c.updated_at,
        u.name as seller_name,
        u.phone as seller_phone
      FROM favorites f
      INNER JOIN cars c ON f.car_id = c.id
      LEFT JOIN users u ON c.seller_id = u.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [userId, limit, offset]
    );

    const favorites = result.rows.map((row) => ({
      favorite_id: row.favorite_id,
      favorited_at: row.favorited_at,
      car: {
        id: row.id,
        seller_id: row.seller_id,
        seller: {
          name: row.seller_name,
          phone: row.seller_phone,
        },
        make: row.make,
        model: row.model,
        year: row.year,
        price: parseFloat(row.price),
        body_type: row.body_type,
        fuel_type: row.fuel_type,
        transmission: row.transmission,
        engine: row.engine,
        color: row.color,
        doors: row.doors,
        co2_emissions: row.co2_emissions,
        description: row.description,
        image_urls: row.image_urls || [],
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    }));

    res.json({
      favorites,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Failed to fetch favorites." });
  }
});

// POST /favorites/:carId - Add car to favorites (protected)
router.post("/favorites/:carId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { carId } = req.params;

    // Check if car exists
    const carResult = await db.query("SELECT * FROM cars WHERE id = $1", [carId]);
    if (carResult.rows.length === 0) {
      return res.status(404).json({ error: "Car listing not found." });
    }

    // Check if already favorited (UNIQUE constraint will handle this, but check for better error message)
    const existingFavorite = await db.query(
      "SELECT * FROM favorites WHERE user_id = $1 AND car_id = $2",
      [userId, carId]
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(400).json({ error: "Car is already in your favorites." });
    }

    // Add to favorites
    await db.query(
      "INSERT INTO favorites (user_id, car_id) VALUES ($1, $2) RETURNING *",
      [userId, carId]
    );

    res.status(201).json({ message: "Car added to favorites successfully" });
  } catch (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      return res.status(400).json({ error: "Car is already in your favorites." });
    }
    console.error("Error adding to favorites:", error);
    res.status(500).json({ error: "Failed to add car to favorites." });
  }
});

// DELETE /favorites/:carId - Remove car from favorites (protected)
router.delete("/favorites/:carId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { carId } = req.params;

    // Check if favorite exists
    const favoriteResult = await db.query(
      "SELECT * FROM favorites WHERE user_id = $1 AND car_id = $2",
      [userId, carId]
    );

    if (favoriteResult.rows.length === 0) {
      return res.status(404).json({ error: "Car is not in your favorites." });
    }

    // Remove from favorites
    await db.query("DELETE FROM favorites WHERE user_id = $1 AND car_id = $2", [
      userId,
      carId,
    ]);

    res.json({ message: "Car removed from favorites successfully" });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({ error: "Failed to remove car from favorites." });
  }
});

// GET /listings - Get user's car listings (protected)
router.get("/listings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || null; // Optional status filter

    // Build WHERE clause
    let whereClause = "seller_id = $1";
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM cars WHERE ${whereClause}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Add limit and offset
    params.push(limit, offset);

    // Get user's listings
    const result = await db.query(
      `
      SELECT *
      FROM cars
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `,
      params
    );

    const listings = result.rows.map((row) => ({
      id: row.id,
      seller_id: row.seller_id,
      make: row.make,
      model: row.model,
      year: row.year,
      price: parseFloat(row.price),
      body_type: row.body_type,
      fuel_type: row.fuel_type,
      transmission: row.transmission,
      engine: row.engine,
      color: row.color,
      doors: row.doors,
      co2_emissions: row.co2_emissions,
      description: row.description,
      image_urls: row.image_urls || [],
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    res.json({
      listings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching user listings:", error);
    res.status(500).json({ error: "Failed to fetch user listings." });
  }
});

module.exports = router;
