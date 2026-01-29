const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/auth");

function mapPartRow(row) {
  const imageUrls = row.image_urls || [];
  const priceNumber = parseFloat(row.price);

  return {
    id: row.id,
    seller_id: row.seller_id,
    name: row.name,
    price: priceNumber,
    category: row.category,
    brand: row.brand,
    compatibility: row.compatibility,
    condition: row.condition,
    warranty: row.warranty,
    description: row.description,
    image_urls: imageUrls,
    status: row.status,
    location: row.location,
    is_best_offer: row.is_best_offer,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // camelCase shape
    imageUrl: imageUrls[0] || null,
    images: imageUrls,
    isBestOffer: row.is_best_offer,
  };
}

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || "active";

    const countResult = await db.query(
      "SELECT COUNT(*) FROM parts WHERE status = $1",
      [status]
    );
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const result = await db.query(
      `
      SELECT * FROM parts
      WHERE status = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [status, limit, offset]
    );

    const parts = result.rows.map(mapPartRow);

    res.json({
      parts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching parts:", error);
    res.status(500).json({ error: "Failed to fetch parts." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM parts WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Part listing not found." });
    }

    const part = mapPartRow(result.rows[0]);
    res.json({ part });
  } catch (error) {
    console.error("Error fetching part:", error);
    res.status(500).json({ error: "Failed to fetch part." });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      price,
      category,
      brand,
      compatibility,
      condition,
      warranty,
      description,
      image_urls,
      status = "active",
      location,
      is_best_offer,
      // camelCase convenience
      isBestOffer,
    } = req.body;

    if (!name || !price || !category || !brand || !compatibility || !condition || !warranty) {
      return res.status(400).json({
        error: "Name, price, category, brand, compatibility, condition, and warranty are required.",
      });
    }

    if (isNaN(price) || parseFloat(price) <= 0) {
      return res.status(400).json({ error: "Price must be a positive number." });
    }

    const imageUrls = Array.isArray(image_urls) ? image_urls : image_urls ? [image_urls] : [];
    const finalIsBestOffer = typeof is_best_offer === "boolean" ? is_best_offer : !!isBestOffer;

    const result = await db.query(
      `
      INSERT INTO parts (
        seller_id, name, price, category, brand, compatibility,
        condition, warranty, description, image_urls, status, location,
        is_best_offer
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `,
      [
        userId,
        name,
        parseFloat(price),
        category,
        brand,
        compatibility,
        condition,
        warranty,
        description || null,
        imageUrls,
        status,
        location || null,
        finalIsBestOffer,
      ]
    );

    const part = mapPartRow(result.rows[0]);
    res.status(201).json({
      message: "Part listing created successfully",
      part,
    });
  } catch (error) {
    console.error("Error creating part listing:", error);
    res.status(500).json({ error: "Failed to create part listing." });
  }
});

module.exports = router;

