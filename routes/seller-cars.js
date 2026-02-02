const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const authenticateToken = require("../middleware/auth");

// Configure multer for image uploads
const uploadDir = path.join(__dirname, "../public/images/cars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `car-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed"));
    }
  },
});

// All routes here require an authenticated seller (user with any role for now)
router.use(authenticateToken);

// Get all cars for the authenticated seller
router.get("/", async (req, res) => {
  const sellerId = req.user.userId;

  try {
    const result = await db.query(
      "SELECT * FROM cars WHERE seller_id = $1 ORDER BY created_at DESC",
      [sellerId]
    );
    res.json({ cars: result.rows });
  } catch (error) {
    console.error("Error fetching seller cars:", error);
    res.status(500).json({ error: "Failed to fetch cars for this seller" });
  }
});

// Upload images for a car
router.post("/:id/images", upload.array("images", 5), async (req, res) => {
  const sellerId = req.user.userId;
  const { id } = req.params;

  try {
    // Verify car belongs to seller
    const carCheck = await db.query(
      "SELECT id, image_urls FROM cars WHERE id = $1 AND seller_id = $2",
      [id, sellerId]
    );

    if (carCheck.rows.length === 0) {
      return res.status(404).json({ error: "Car not found for this seller" });
    }

    const existingImages = carCheck.rows[0].image_urls || [];
    const newImages = req.files.map(
      (file) => `/images/cars/${file.filename}`
    );
    const updatedImages = [...existingImages, ...newImages];

    const result = await db.query(
      "UPDATE cars SET image_urls = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND seller_id = $3 RETURNING *",
      [updatedImages, id, sellerId]
    );

    res.json({
      message: "Images uploaded successfully",
      car: result.rows[0],
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({ error: "Failed to upload images" });
  }
});

// Create a new car listing for the authenticated seller
router.post("/", async (req, res) => {
  const sellerId = req.user.userId;
  const {
    make,
    model,
    year,
    price,
    body_type,
    fuel_type,
    transmission,
    mileage,
    location,
    status,
    image_urls,
  } = req.body;

  try {
    if (!model || !year || !price) {
      return res.status(400).json({
        error: "Model, year and price are required to create a car listing.",
      });
    }

    const insertQuery = `
      INSERT INTO cars (
        seller_id, make, model, year, price, body_type, fuel_type,
        transmission, mileage, location, status, image_urls
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, 'active'), $12)
      RETURNING *;
    `;

    const result = await db.query(insertQuery, [
      sellerId,
      make || null,
      model,
      year,
      price,
      body_type || null,
      fuel_type || null,
      transmission || null,
      mileage || null,
      location || null,
      status || null,
      image_urls || [],
    ]);

    res.status(201).json({
      message: "Car listing created successfully",
      car: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating seller car:", error);
    res.status(500).json({ error: "Failed to create car listing" });
  }
});

// Update a car listing for the authenticated seller
router.patch("/:id", async (req, res) => {
  const sellerId = req.user.userId;
  const { id } = req.params;
  const fields = [
    "make",
    "model",
    "year",
    "price",
    "body_type",
    "fuel_type",
    "transmission",
    "mileage",
    "location",
    "status",
    "image_urls",
  ];

  const updates = [];
  const values = [];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      values.push(req.body[field]);
      updates.push(`${field} = $${values.length}`);
    }
  });

  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields provided to update" });
  }

  values.push(sellerId);
  values.push(id);

  const updateQuery = `
    UPDATE cars
    SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE seller_id = $${values.length - 1} AND id = $${values.length}
    RETURNING *;
  `;

  try {
    const result = await db.query(updateQuery, values);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Car not found for this seller or no changes applied" });
    }

    res.json({
      message: "Car listing updated successfully",
      car: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating seller car:", error);
    res.status(500).json({ error: "Failed to update car listing" });
  }
});

// Delete a car listing for the authenticated seller
router.delete("/:id", async (req, res) => {
  const sellerId = req.user.userId;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM cars WHERE seller_id = $1 AND id = $2 RETURNING id;",
      [sellerId, id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Car not found for this seller or already deleted" });
    }

    res.json({ message: "Car listing deleted successfully" });
  } catch (error) {
    console.error("Error deleting seller car:", error);
    res.status(500).json({ error: "Failed to delete car listing" });
  }
});

module.exports = router;

