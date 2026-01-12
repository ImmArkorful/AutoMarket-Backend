# AutoMarket Backend API

Backend API server for the AutoMarket car marketplace application.

## 📁 Project Structure

```
AutoMarket-ccitg-Backend/
├── index.js              # Main server entry point
├── db.js                 # Database connection configuration
├── dbsetup.js            # Database setup script
├── package.json          # Dependencies and scripts
├── .gitignore            # Git ignore rules
├── BACKEND_PLAN.md       # Detailed implementation plan
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── cars.js           # Car listings routes
│   └── user.js           # User profile and favorites routes
├── middleware/
│   └── auth.js           # JWT authentication middleware
└── public/
    └── images/           # Static image storage
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=automarket
PG_USER=postgres
PG_PASSWORD=your_password_here

# Server
PORT=3001
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_very_secure_jwt_secret_here_change_in_production

# Frontend URL (comma-separated for multiple origins)
FRONTEND_URL=http://localhost:5173,http://localhost:4173

# Optional: Allow all origins (set to 'true' for development only)
ALLOW_ALL_ORIGINS=false
```

3. Set up the database:
```bash
npm run setup
```

4. Start the development server:
```bash
npm run dev
```

Or start the production server:
```bash
npm start
```

## 📝 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run setup` - Run the database setup script
- `npm test` - Run end-to-end tests
- `npm run test-db` - Test database connection
- `npm run drop-tables` - Drop all tables except users (use with caution)

## 📚 API Documentation

Swagger/OpenAPI documentation is available at:

**http://localhost:3001/api-docs**

You can:
- View all available endpoints
- See request/response schemas
- Test endpoints directly from the documentation
- Copy curl commands for each endpoint

To use authenticated endpoints:
1. Register or login to get a JWT token
2. Click the "Authorize" button in Swagger UI
3. Enter: `Bearer <your-token-here>`
4. Click "Authorize" to apply the token to all requests

## 🔄 Implementation Status

This is a placeholder structure. See `BACKEND_PLAN.md` for the detailed implementation plan.

### Current Status: Phase 1 Complete ✅
- Folder structure created
- Placeholder files created
- Package.json configured
- Planning document created

### Next Steps: Phase 2
- Install dependencies
- Set up PostgreSQL database
- Implement database schema
- Test database connection

## 📚 API Endpoints (Planned)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Cars
- `GET /api/cars` - Get all cars (with filters, pagination)
- `GET /api/cars/:id` - Get single car by ID
- `POST /api/cars` - Create new listing (protected)
- `PUT /api/cars/:id` - Update listing (protected, owner only)
- `DELETE /api/cars/:id` - Delete listing (protected, owner only)

### User
- `GET /api/user/profile` - Get user profile (protected)
- `PUT /api/user/profile` - Update profile (protected)
- `GET /api/user/favorites` - Get favorites (protected)
- `POST /api/user/favorites/:carId` - Add to favorites (protected)
- `DELETE /api/user/favorites/:carId` - Remove from favorites (protected)
- `GET /api/user/listings` - Get user's listings (protected)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## 📖 Documentation

For detailed implementation plans and next steps, see `BACKEND_PLAN.md`.
