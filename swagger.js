const swaggerJsdoc = require("swagger-jsdoc");
require("dotenv").config();

const PORT = process.env.PORT || 3001;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AutoMarket API",
      version: "1.0.0",
      description: "Backend API for AutoMarket car marketplace application",
      contact: {
        name: "AutoMarket API Support",
      },
    },
    servers: [
      {
        url: `http://13.218.173.57:${PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token obtained from /api/auth/register or /api/auth/login",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "User ID",
              example: 1,
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "user@example.com",
            },
            name: {
              type: "string",
              description: "User's full name",
              example: "John Doe",
            },
            phone: {
              type: "string",
              description: "User's phone number",
              example: "+1234567890",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        Car: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Car listing ID",
              example: 1,
            },
            seller_id: {
              type: "integer",
              description: "ID of the user who listed the car",
              example: 1,
            },
            make: {
              type: "string",
              description: "Car manufacturer",
              example: "Toyota",
            },
            model: {
              type: "string",
              description: "Car model",
              example: "Corolla",
            },
            year: {
              type: "integer",
              description: "Manufacturing year",
              example: 2020,
            },
            price: {
              type: "number",
              format: "float",
              description: "Price in currency units",
              example: 18000.0,
            },
            body_type: {
              type: "string",
              description: "Body type",
              enum: ["Sedan", "SUV", "Coupe", "Hatchback", "Convertible", "Truck", "Van"],
              example: "Sedan",
            },
            fuel_type: {
              type: "string",
              description: "Fuel type",
              enum: ["Petrol", "Diesel", "Hybrid", "Electric"],
              example: "Petrol",
            },
            transmission: {
              type: "string",
              description: "Transmission type",
              enum: ["Automatic", "Manual"],
              example: "Automatic",
            },
            engine: {
              type: "string",
              description: "Engine specifications",
              example: "1800 cm³ (150 kW / 200 HP)",
            },
            color: {
              type: "string",
              description: "Car color",
              example: "White",
            },
            doors: {
              type: "integer",
              description: "Number of doors",
              example: 4,
            },
            co2_emissions: {
              type: "string",
              description: "CO2 emissions",
              example: "120 g/km",
            },
            description: {
              type: "string",
              description: "Car description",
              example: "Excellent condition, well maintained",
            },
            image_urls: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of image URLs",
              example: ["/images/car1.jpg", "/images/car2.jpg"],
            },
            status: {
              type: "string",
              enum: ["active", "sold", "pending"],
              description: "Listing status",
              example: "active",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: {
              type: "string",
              minLength: 6,
              example: "password123",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            phone: {
              type: "string",
              example: "+1234567890",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: {
              type: "string",
              example: "password123",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "User registered successfully",
            },
            token: {
              type: "string",
              description: "JWT token for authentication",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "Error message",
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 20,
            },
            totalCount: {
              type: "integer",
              example: 100,
            },
            totalPages: {
              type: "integer",
              example: 5,
            },
            hasMore: {
              type: "boolean",
              example: true,
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js", "./routes/*-swagger.js", "./index.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
