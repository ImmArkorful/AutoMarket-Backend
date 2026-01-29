const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/auth");

// Simple admin guard based on user role
async function requireAdmin(req, res, next) {
  try {
    const userId = req.user.userId;
    const result = await db.query("SELECT role FROM users WHERE id = $1", [
      userId,
    ]);
    if (!result.rows.length || result.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required." });
    }
    next();
  } catch (err) {
    console.error("Admin guard error:", err);
    res.status(500).json({ error: "Failed to verify admin role." });
  }
}

// List users (basic info)
router.get(
  "/users",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await db.query(
        "SELECT id, email, name, phone, role, created_at FROM users ORDER BY created_at DESC"
      );
      res.json({ users: result.rows });
    } catch (err) {
      console.error("Admin list users error:", err);
      res.status(500).json({ error: "Failed to load users." });
    }
  }
);

// Update user role
router.put(
  "/users/:userId/role",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      if (!role) {
        return res.status(400).json({ error: "Role is required." });
      }
      const result = await db.query(
        "UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, phone, role, created_at",
        [role, userId]
      );
      if (!result.rows.length) {
        return res.status(404).json({ error: "User not found." });
      }
      res.json({ user: result.rows[0] });
    } catch (err) {
      console.error("Admin update role error:", err);
      res.status(500).json({ error: "Failed to update user role." });
    }
  }
);

// Delete user (and cascade listings, favorites, etc.)
router.delete(
  "/users/:userId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await db.query(
        "DELETE FROM users WHERE id = $1 RETURNING id",
        [userId]
      );
      if (!result.rows.length) {
        return res.status(404).json({ error: "User not found." });
      }
      res.json({ message: "User deleted." });
    } catch (err) {
      console.error("Admin delete user error:", err);
      res.status(500).json({ error: "Failed to delete user." });
    }
  }
);

// List all listings (cars/bikes/trucks/parts) with category
router.get(
  "/listings",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const cars = await db.query(
        `SELECT id, seller_id, make, model, year, price, body_type, fuel_type, transmission, 
         engine, color, doors, co2_emissions, description, image_urls, status, mileage, 
         location, vin_number, equipment, cylindrics, hp_kw, is_best_offer, created_at, 
         'cars' AS category FROM cars`
      );
      const bikes = await db.query(
        `SELECT id, seller_id, make, model, year, price, body_type, fuel_type, transmission, 
         engine, color, co2_emissions, description, image_urls, status, mileage, 
         location, vin_number, equipment, cylindrics, hp_kw, is_best_offer, created_at, 
         'bikes' AS category FROM bikes`
      );
      const trucks = await db.query(
        `SELECT id, seller_id, make, model, year, price, body_type, fuel_type, transmission, 
         engine, color, doors, co2_emissions, description, image_urls, status, mileage, 
         location, vin_number, equipment, cylindrics, hp_kw, is_best_offer, created_at, 
         'trucks' AS category FROM trucks`
      );
      const parts = await db.query(
        `SELECT id, seller_id, name AS model, NULL::INT AS year, price, category, brand, 
         compatibility, condition, warranty, description, image_urls, status, location, 
         is_best_offer, created_at, 'parts' AS category FROM parts`
      );

      const listings = [
        ...cars.rows,
        ...bikes.rows,
        ...trucks.rows,
        ...parts.rows,
      ].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      res.json({ listings });
    } catch (err) {
      console.error("Admin list listings error:", err);
      res.status(500).json({ error: "Failed to load listings." });
    }
  }
);

// Helper to validate and normalize category to table name
function resolveListingTable(category) {
  if (
    category === "cars" ||
    category === "bikes" ||
    category === "trucks" ||
    category === "parts"
  ) {
    return category;
  }
  return null;
}

// Update a listing by category
router.put(
  "/listings/:category/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { category, id } = req.params;
      const table = resolveListingTable(category);
      if (!table) {
        return res.status(400).json({ error: "Invalid category." });
      }

      const {
        price,
        status,
        make,
        model,
        year,
        description,
        image_urls,
        body_type,
        fuel_type,
        transmission,
        engine,
        color,
        doors,
        mileage,
        location,
        vin_number,
        // Parts-specific
        name,
        brand,
        compatibility,
        condition: partCondition,
        warranty,
      } = req.body;

      const fields = [];
      const values = [];
      let idx = 1;

      // Common fields
      if (price !== undefined) {
        fields.push(`price = $${idx++}`);
        values.push(price);
      }
      if (status !== undefined) {
        fields.push(`status = $${idx++}`);
        values.push(status);
      }
      if (description !== undefined) {
        fields.push(`description = $${idx++}`);
        values.push(description);
      }
      if (image_urls !== undefined) {
        fields.push(`image_urls = $${idx++}`);
        values.push(Array.isArray(image_urls) ? image_urls : []);
      }
      if (location !== undefined) {
        fields.push(`location = $${idx++}`);
        values.push(location);
      }

      // Vehicle-specific fields (cars, bikes, trucks)
      if (category !== "parts") {
        if (make !== undefined) {
          fields.push(`make = $${idx++}`);
          values.push(make);
        }
        if (model !== undefined) {
          fields.push(`model = $${idx++}`);
          values.push(model);
        }
        if (year !== undefined) {
          fields.push(`year = $${idx++}`);
          values.push(year);
        }
        if (body_type !== undefined) {
          fields.push(`body_type = $${idx++}`);
          values.push(body_type);
        }
        if (fuel_type !== undefined) {
          fields.push(`fuel_type = $${idx++}`);
          values.push(fuel_type);
        }
        if (transmission !== undefined) {
          fields.push(`transmission = $${idx++}`);
          values.push(transmission);
        }
        if (engine !== undefined) {
          fields.push(`engine = $${idx++}`);
          values.push(engine);
        }
        if (color !== undefined) {
          fields.push(`color = $${idx++}`);
          values.push(color);
        }
        if (doors !== undefined && (category === "cars" || category === "trucks")) {
          fields.push(`doors = $${idx++}`);
          values.push(doors);
        }
        if (mileage !== undefined) {
          fields.push(`mileage = $${idx++}`);
          values.push(mileage);
        }
        if (vin_number !== undefined) {
          fields.push(`vin_number = $${idx++}`);
          values.push(vin_number);
        }
      } else {
        // Parts-specific fields
        if (name !== undefined) {
          fields.push(`name = $${idx++}`);
          values.push(name);
        }
        if (brand !== undefined) {
          fields.push(`brand = $${idx++}`);
          values.push(brand);
        }
        if (compatibility !== undefined) {
          fields.push(`compatibility = $${idx++}`);
          values.push(compatibility);
        }
        if (partCondition !== undefined) {
          fields.push(`condition = $${idx++}`);
          values.push(partCondition);
        }
        if (warranty !== undefined) {
          fields.push(`warranty = $${idx++}`);
          values.push(warranty);
        }
      }

      if (fields.length === 0) {
        return res
          .status(400)
          .json({ error: "No updatable fields provided." });
      }

      // Always bump updated_at
      fields.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id);

      const query = `
        UPDATE ${table}
        SET ${fields.join(", ")}
        WHERE id = $${idx}
        RETURNING *
      `;

      const result = await db.query(query, values);
      if (!result.rows.length) {
        return res.status(404).json({ error: "Listing not found." });
      }

      res.json({ listing: result.rows[0] });
    } catch (err) {
      console.error("Admin update listing error:", err);
      res.status(500).json({ error: "Failed to update listing." });
    }
  }
);

// Delete a listing by category
router.delete(
  "/listings/:category/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { category, id } = req.params;
      const table = resolveListingTable(category);
      if (!table) {
        return res.status(400).json({ error: "Invalid category." });
      }
      const result = await db.query(
        `DELETE FROM ${table} WHERE id = $1 RETURNING id`,
        [id]
      );
      if (!result.rows.length) {
        return res.status(404).json({ error: "Listing not found." });
      }
      res.json({ message: "Listing deleted." });
    } catch (err) {
      console.error("Admin delete listing error:", err);
      res.status(500).json({ error: "Failed to delete listing." });
    }
  }
);

module.exports = router;

