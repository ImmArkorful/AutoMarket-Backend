const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/auth");
require("./cars-swagger");

// GET / - Get all cars/listings (with filters, pagination, sorting)
router.get("/", async (req, res) => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const {
      minPrice,
      maxPrice,
      make,
      model,
      year,
      bodyType,
      fuelType,
      transmission,
      status = "active",
    } = req.query;

    // Build WHERE clause dynamically
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Status filter (default to active)
    conditions.push(`c.status = $${paramIndex++}`);
    params.push(status);

    // Price filters
    if (minPrice) {
      conditions.push(`c.price >= $${paramIndex++}`);
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      conditions.push(`c.price <= $${paramIndex++}`);
      params.push(parseFloat(maxPrice));
    }

    // Make filter
    if (make) {
      conditions.push(`LOWER(c.make) LIKE LOWER($${paramIndex++})`);
      params.push(`%${make}%`);
    }

    // Model filter
    if (model) {
      conditions.push(`LOWER(c.model) LIKE LOWER($${paramIndex++})`);
      params.push(`%${model}%`);
    }

    // Year filter
    if (year) {
      conditions.push(`c.year = $${paramIndex++}`);
      params.push(parseInt(year));
    }

    // Body type filter
    if (bodyType) {
      conditions.push(`LOWER(c.body_type) = LOWER($${paramIndex++})`);
      params.push(bodyType);
    }

    // Fuel type filter
    if (fuelType) {
      conditions.push(`LOWER(c.fuel_type) = LOWER($${paramIndex++})`);
      params.push(fuelType);
    }

    // Transmission filter
    if (transmission) {
      conditions.push(`LOWER(c.transmission) = LOWER($${paramIndex++})`);
      params.push(transmission);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM cars c ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get cars with seller info
    const carsQuery = `
      SELECT 
        c.*,
        u.name as seller_name,
        u.phone as seller_phone
      FROM cars c
      LEFT JOIN users u ON c.seller_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await db.query(carsQuery, params);

    // Format response
    const cars = result.rows.map((row) => ({
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
    }));

    res.json({
      cars,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching cars:", error);
    res.status(500).json({ error: "Failed to fetch cars." });
  }
});

// GET /:id - Get single car listing by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      SELECT 
        c.*,
        u.name as seller_name,
        u.phone as seller_phone,
        u.email as seller_email
      FROM cars c
      LEFT JOIN users u ON c.seller_id = u.id
      WHERE c.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Car listing not found." });
    }

    const row = result.rows[0];
    const car = {
      id: row.id,
      seller_id: row.seller_id,
      seller: {
        name: row.seller_name,
        phone: row.seller_phone,
        email: row.seller_email,
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
    };

    res.json({ car });
  } catch (error) {
    console.error("Error fetching car:", error);
    res.status(500).json({ error: "Failed to fetch car." });
  }
});

// POST / - Create new car listing (protected)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      make,
      model,
      year,
      price,
      body_type,
      fuel_type,
      transmission,
      engine,
      color,
      doors,
      co2_emissions,
      description,
      image_urls,
      status = "active",
    } = req.body;

    // Validate required fields
    if (!model || !year || !price) {
      return res.status(400).json({
        error: "Model, year, and price are required fields.",
      });
    }

    // Validate price
    if (isNaN(price) || parseFloat(price) <= 0) {
      return res.status(400).json({ error: "Price must be a positive number." });
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || parseInt(year) < 1900 || parseInt(year) > currentYear + 1) {
      return res.status(400).json({
        error: `Year must be between 1900 and ${currentYear + 1}.`,
      });
    }

    // Validate image_urls (should be an array)
    const imageUrls = Array.isArray(image_urls) ? image_urls : image_urls ? [image_urls] : [];

    // Insert car listing
    const result = await db.query(
      `
      INSERT INTO cars (
        seller_id, make, model, year, price, body_type, fuel_type,
        transmission, engine, color, doors, co2_emissions, description,
        image_urls, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `,
      [
        userId,
        make || null,
        model,
        parseInt(year),
        parseFloat(price),
        body_type || null,
        fuel_type || null,
        transmission || null,
        engine || null,
        color || null,
        doors ? parseInt(doors) : null,
        co2_emissions || null,
        description || null,
        imageUrls,
        status,
      ]
    );

    const car = result.rows[0];
    res.status(201).json({
      message: "Car listing created successfully",
      car: {
        id: car.id,
        seller_id: car.seller_id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: parseFloat(car.price),
        body_type: car.body_type,
        fuel_type: car.fuel_type,
        transmission: car.transmission,
        engine: car.engine,
        color: car.color,
        doors: car.doors,
        co2_emissions: car.co2_emissions,
        description: car.description,
        image_urls: car.image_urls || [],
        status: car.status,
        created_at: car.created_at,
        updated_at: car.updated_at,
      },
    });
  } catch (error) {
    console.error("Error creating car listing:", error);
    res.status(500).json({ error: "Failed to create car listing." });
  }
});

// PUT /:id - Update car listing (protected, owner only)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const {
      make,
      model,
      year,
      price,
      body_type,
      fuel_type,
      transmission,
      engine,
      color,
      doors,
      co2_emissions,
      description,
      image_urls,
      status,
    } = req.body;

    // Check if car exists and verify ownership
    const carResult = await db.query("SELECT * FROM cars WHERE id = $1", [id]);

    if (carResult.rows.length === 0) {
      return res.status(404).json({ error: "Car listing not found." });
    }

    const car = carResult.rows[0];
    if (car.seller_id !== userId) {
      return res.status(403).json({ error: "You don't have permission to update this listing." });
    }

    // Build UPDATE query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (make !== undefined) {
      updateFields.push(`make = $${paramIndex++}`);
      updateValues.push(make);
    }
    if (model !== undefined) {
      updateFields.push(`model = $${paramIndex++}`);
      updateValues.push(model);
    }
    if (year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || parseInt(year) < 1900 || parseInt(year) > currentYear + 1) {
        return res.status(400).json({
          error: `Year must be between 1900 and ${currentYear + 1}.`,
        });
      }
      updateFields.push(`year = $${paramIndex++}`);
      updateValues.push(parseInt(year));
    }
    if (price !== undefined) {
      if (isNaN(price) || parseFloat(price) <= 0) {
        return res.status(400).json({ error: "Price must be a positive number." });
      }
      updateFields.push(`price = $${paramIndex++}`);
      updateValues.push(parseFloat(price));
    }
    if (body_type !== undefined) {
      updateFields.push(`body_type = $${paramIndex++}`);
      updateValues.push(body_type);
    }
    if (fuel_type !== undefined) {
      updateFields.push(`fuel_type = $${paramIndex++}`);
      updateValues.push(fuel_type);
    }
    if (transmission !== undefined) {
      updateFields.push(`transmission = $${paramIndex++}`);
      updateValues.push(transmission);
    }
    if (engine !== undefined) {
      updateFields.push(`engine = $${paramIndex++}`);
      updateValues.push(engine);
    }
    if (color !== undefined) {
      updateFields.push(`color = $${paramIndex++}`);
      updateValues.push(color);
    }
    if (doors !== undefined) {
      updateFields.push(`doors = $${paramIndex++}`);
      updateValues.push(doors ? parseInt(doors) : null);
    }
    if (co2_emissions !== undefined) {
      updateFields.push(`co2_emissions = $${paramIndex++}`);
      updateValues.push(co2_emissions);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }
    if (image_urls !== undefined) {
      const imageUrls = Array.isArray(image_urls) ? image_urls : image_urls ? [image_urls] : [];
      updateFields.push(`image_urls = $${paramIndex++}`);
      updateValues.push(imageUrls);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update." });
    }

    // Add updated_at and WHERE clause
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const updateQuery = `
      UPDATE cars 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(updateQuery, updateValues);

    const updatedCar = result.rows[0];
    res.json({
      message: "Car listing updated successfully",
      car: {
        id: updatedCar.id,
        seller_id: updatedCar.seller_id,
        make: updatedCar.make,
        model: updatedCar.model,
        year: updatedCar.year,
        price: parseFloat(updatedCar.price),
        body_type: updatedCar.body_type,
        fuel_type: updatedCar.fuel_type,
        transmission: updatedCar.transmission,
        engine: updatedCar.engine,
        color: updatedCar.color,
        doors: updatedCar.doors,
        co2_emissions: updatedCar.co2_emissions,
        description: updatedCar.description,
        image_urls: updatedCar.image_urls || [],
        status: updatedCar.status,
        created_at: updatedCar.created_at,
        updated_at: updatedCar.updated_at,
      },
    });
  } catch (error) {
    console.error("Error updating car listing:", error);
    res.status(500).json({ error: "Failed to update car listing." });
  }
});

// DELETE /:id - Delete car listing (protected, owner only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Check if car exists and verify ownership
    const carResult = await db.query("SELECT * FROM cars WHERE id = $1", [id]);

    if (carResult.rows.length === 0) {
      return res.status(404).json({ error: "Car listing not found." });
    }

    const car = carResult.rows[0];
    if (car.seller_id !== userId) {
      return res.status(403).json({ error: "You don't have permission to delete this listing." });
    }

    // Delete the car listing (CASCADE will handle related records in favorites and inquiries)
    await db.query("DELETE FROM cars WHERE id = $1", [id]);

    res.json({ message: "Car listing deleted successfully" });
  } catch (error) {
    console.error("Error deleting car listing:", error);
    res.status(500).json({ error: "Failed to delete car listing." });
  }
});

module.exports = router;
