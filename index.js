const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const authRoutes = require("./routes/auth");
const carsRoutes = require("./routes/cars");
const userRoutes = require("./routes/user");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for Swagger UI
  })
);

// CORS configuration
const defaultAllowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:3001",
  "http://localhost:3001",
]);

// Add any additional origins from environment variable
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(",")
    .map((url) => url.trim())
    .filter(Boolean)
    .forEach((url) => defaultAllowedOrigins.add(url));
}

const allowAllOrigins =
  process.env.ALLOW_ALL_ORIGINS === "true" ||
  defaultAllowedOrigins.has("*");

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    // Allow same-origin requests (for Swagger UI and same-server requests)
    if (origin && (origin.includes(`localhost:${PORT}`) || origin.includes(`127.0.0.1:${PORT}`))) {
      return callback(null, true);
    }

    if (allowAllOrigins || defaultAllowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      console.log("🚫 CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
};

app.use(cors(corsOptions));

// Logging middleware
app.use(morgan("combined"));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'} - User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'No User-Agent'}`);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files
app.use("/images", express.static("public/images"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "AutoMarket API Documentation",
}));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/cars", carsRoutes);
app.use("/api/user", userRoutes);

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "AutoMarket API is running!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: "Something went wrong!", 
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error"
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚗 AutoMarket Backend server is running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
});

module.exports = app;
