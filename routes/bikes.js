const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/auth");

// Helper to map DB row to frontend-friendly shape
function mapBikeRow(row) {
  const imageUrls = row.image_urls || [];
  const priceNumber = parseFloat(row.price);

  return {
    id: row.id,
    seller_id: row.seller_id,
    make: row.make,
    model: row.model,
    year: row.year,
    price: priceNumber,
    body_type: row.body_type,
    fuel_type: row.fuel_type,
    transmission: row.transmission,
    engine: row.engine,
    color: row.color,
    co2_emissions: row.co2_emissions,
    description: row.description,
    image_urls: imageUrls,
    status: row.status,
    mileage: row.mileage,
    location: row.location,
    vin_number: row.vin_number,
    equipment: row.equipment || [],
    cylindrics: row.cylindrics,
    hp_kw: row.hp_kw,
    is_best_offer: row.is_best_offer,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // camelCase for frontend
    name: [row.make, row.model].filter(Boolean).join(" "),
    fabrication: row.year ? String(row.year) : null,
    bodyType: row.body_type,
    fuel: row.fuel_type,
    co2Emissions: row.co2_emissions,
    imageUrl: imageUrls[0] || null,
    images: imageUrls,
    vinNumber: row.vin_number,
    hpKw: row.hp_kw,
    isBestOffer: row.is_best_offer,
  };
}

// GET /api/bikes - list bikes (simple pagination)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const status = req.query.status || "active";

    const countResult = await db.query(
      "SELECT COUNT(*) FROM bikes WHERE status = $1",
      [status]
    );
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const result = await db.query(
      `
      SELECT * FROM bikes
      WHERE status = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [status, limit, offset]
    );

    const bikes = result.rows.map(mapBikeRow);

    res.json({
      bikes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching bikes:", error);
    res.status(500).json({ error: "Failed to fetch bikes." });
  }
});

// GET /api/bikes/:id - single bike
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM bikes WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bike listing not found." });
    }

    const bike = mapBikeRow(result.rows[0]);
    res.json({ bike });
  } catch (error) {
    console.error("Error fetching bike:", error);
    res.status(500).json({ error: "Failed to fetch bike." });
  }
});

// POST /api/bikes - create bike listing (optional future use)
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
      co2_emissions,
      description,
      image_urls,
      status = "active",
      mileage,
      location,
      vin_number,
      equipment,
      cylindrics,
      hp_kw,
      is_best_offer,
      manufacturer,
      fabrication,
      bodyType,
      fuelType,
      co2Emissions,
      vinNumber,
      hpKw,
      isBestOffer,
    } = req.body;

    const finalMake = make || manufacturer || null;
    const finalYear = year || fabrication;
    const finalBodyType = body_type || bodyType || null;
    const finalFuelType = fuel_type || fuelType || null;
    const finalCo2 = co2_emissions || co2Emissions || null;
    const finalVin = vin_number || vinNumber || null;
    const finalHpKw = hp_kw || hpKw || null;
    const finalIsBestOffer = typeof is_best_offer === "boolean" ? is_best_offer : !!isBestOffer;

    if (!model || !finalYear || !price) {
      return res.status(400).json({
        error: "Model, year, and price are required fields.",
      });
    }

    if (isNaN(price) || parseFloat(price) <= 0) {
      return res.status(400).json({ error: "Price must be a positive number." });
    }

    const currentYear = new Date().getFullYear();
    if (isNaN(finalYear) || parseInt(finalYear) < 1900 || parseInt(finalYear) > currentYear + 1) {
      return res.status(400).json({
        error: `Year must be between 1900 and ${currentYear + 1}.`,
      });
    }

    const imageUrls = Array.isArray(image_urls) ? image_urls : image_urls ? [image_urls] : [];
    const equipmentArray = Array.isArray(equipment)
      ? equipment
      : equipment
      ? [equipment]
      : [];

    const result = await db.query(
      `
      INSERT INTO bikes (
        seller_id, make, model, year, price, body_type, fuel_type,
        transmission, engine, color, co2_emissions, description,
        image_urls, status, mileage, location, vin_number, equipment,
        cylindrics, hp_kw, is_best_offer
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `,
      [
        userId,
        finalMake,
        model,
        parseInt(finalYear),
        parseFloat(price),
        finalBodyType,
        finalFuelType,
        transmission || null,
        engine || null,
        color || null,
        finalCo2,
        description || null,
        imageUrls,
        status,
        mileage ? parseInt(mileage) : null,
        location || null,
        finalVin,
        equipmentArray,
        cylindrics ? parseInt(cylindrics) : null,
        finalHpKw,
        finalIsBestOffer,
      ]
    );

    const bike = mapBikeRow(result.rows[0]);
    res.status(201).json({
      message: "Bike listing created successfully",
      bike,
    });
  } catch (error) {
    console.error("Error creating bike listing:", error);
    res.status(500).json({ error: "Failed to create bike listing." });
  }
});

module.exports = router;

