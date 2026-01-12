const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const authenticateToken = require("../middleware/auth");
require("dotenv").config();
require("./auth-swagger");

// Register a new user
router.post("/register", async (req, res) => {
  const { email, password, name, phone } = req.body;

  try {
    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    
    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    // Check if user already exists
    const existingUser = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "An account with this email already exists. Please use a different email or try logging in." });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await db.query(
      "INSERT INTO users (email, password_hash, name, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, name, phone, created_at",
      [email, passwordHash, name || null, phone || null]
    );

    const userData = newUser.rows[0];

    const token = jwt.sign(
      { userId: userData.id, email: userData.email },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        created_at: userData.created_at,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    
    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }

    // Find user in database
    const userResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "No account found with this email address. Please check your email or create a new account." });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password. Please try again." });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get current user (protected)
router.get("/me", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const userResult = await db.query(
      "SELECT id, email, name, phone, created_at, updated_at FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = userResult.rows[0];
    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
