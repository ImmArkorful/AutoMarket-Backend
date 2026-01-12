# AutoMarket Backend Implementation Plan

This document outlines the step-by-step plan for implementing the AutoMarket backend API, following the same structure as the MicroApp backend.

## 📁 Current Structure

```
AutoMarket-ccitg-Backend/
├── index.js              # Main server entry point (placeholder)
├── db.js                 # Database connection (placeholder)
├── dbsetup.js            # Database setup script (placeholder)
├── package.json          # Dependencies and scripts
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── routes/
│   ├── auth.js           # Authentication routes (placeholder)
│   ├── cars.js           # Car listings routes (placeholder)
│   └── user.js           # User profile and favorites routes (placeholder)
├── middleware/
│   └── auth.js           # JWT authentication middleware (ready)
└── public/
    └── images/           # Static image storage
```

## 🎯 Implementation Phases

### Phase 1: Project Setup ✅
- [x] Create folder structure
- [x] Create placeholder files
- [x] Set up package.json with dependencies
- [x] Create .env.example
- [x] Create .gitignore

### Phase 2: Database Setup
- [ ] Install dependencies (`npm install`)
- [ ] Set up PostgreSQL database
- [ ] Create database schema in `dbsetup.js`:
  - [ ] Users table (id, email, password_hash, name, phone, created_at, updated_at)
  - [ ] Cars/Listings table (id, seller_id, make, model, year, price, body_type, fuel_type, transmission, engine, color, doors, co2_emissions, description, image_urls, status, created_at, updated_at)
  - [ ] Favorites table (id, user_id, car_id, created_at)
  - [ ] Inquiries/Messages table (id, car_id, buyer_id, seller_id, message, created_at)
  - [ ] Indexes for performance (user_id, seller_id, car_id, price range, etc.)
- [ ] Test database connection
- [ ] Create seed data script (optional)

### Phase 3: Authentication System
- [ ] Implement `routes/auth.js`:
  - [ ] POST `/api/auth/register` - User registration
    - Validate email, password, name, phone
    - Hash password with bcrypt
    - Save user to database
    - Generate JWT token
    - Return token and user info
  - [ ] POST `/api/auth/login` - User login
    - Validate credentials
    - Compare password
    - Generate JWT token
    - Return token and user info
  - [ ] GET `/api/auth/me` - Get current user (protected)
    - Use authenticateToken middleware
    - Get user from database
    - Return user info (without password)
- [ ] Test authentication endpoints

### Phase 4: Car Listings API
- [ ] Implement `routes/cars.js`:
  - [ ] GET `/api/cars` - Get all cars (with filters, pagination, sorting)
    - Query params: page, limit, minPrice, maxPrice, make, model, year, bodyType, fuelType, transmission
    - Implement pagination
    - Implement filtering
    - Return cars list and pagination metadata
  - [ ] GET `/api/cars/:id` - Get single car by ID
    - Get car details
    - Include seller info (name, phone)
    - Return car object
  - [ ] POST `/api/cars` - Create new listing (protected)
    - Validate input (required fields)
    - Handle image uploads (multer)
    - Save images to public/images
    - Save car listing to database
    - Return created listing
  - [ ] PUT `/api/cars/:id` - Update listing (protected, owner only)
    - Verify ownership (seller_id matches user_id)
    - Validate input
    - Handle image updates
    - Update car listing
    - Return updated listing
  - [ ] DELETE `/api/cars/:id` - Delete listing (protected, owner only)
    - Verify ownership
    - Delete associated images
    - Delete car listing
    - Return success message
- [ ] Test car listing endpoints

### Phase 5: User Profile & Favorites
- [ ] Implement `routes/user.js`:
  - [ ] GET `/api/user/profile` - Get user profile (protected)
    - Get user info from database
    - Calculate stats (total listings, total favorites)
    - Return profile with stats
  - [ ] PUT `/api/user/profile` - Update profile (protected)
    - Validate input
    - Update user profile
    - Return updated profile
  - [ ] GET `/api/user/favorites` - Get favorites (protected)
    - Get user's favorite cars
    - Join with cars table
    - Return list of favorite cars
  - [ ] POST `/api/user/favorites/:carId` - Add to favorites (protected)
    - Check if car exists
    - Check if already favorited
    - Add to favorites table
    - Return success message
  - [ ] DELETE `/api/user/favorites/:carId` - Remove from favorites (protected)
    - Remove from favorites table
    - Return success message
  - [ ] GET `/api/user/listings` - Get user's listings (protected)
    - Get all cars where seller_id = user_id
    - Return list of user's listings
- [ ] Test user endpoints

### Phase 6: Image Upload & Storage
- [ ] Configure multer for image uploads
- [ ] Create upload middleware
- [ ] Implement image validation (file type, size)
- [ ] Store images in `public/images/`
- [ ] Generate unique filenames
- [ ] Return image URLs in API responses
- [ ] Implement image deletion on listing delete

### Phase 7: Error Handling & Validation
- [ ] Add input validation middleware
- [ ] Improve error messages
- [ ] Add request validation (Joi or express-validator)
- [ ] Add rate limiting (optional)
- [ ] Add request logging

### Phase 8: Testing & Documentation
- [ ] Test all endpoints
- [ ] Create API documentation (OpenAPI/Swagger or markdown)
- [ ] Test error scenarios
- [ ] Test authentication flows
- [ ] Test file uploads
- [ ] Performance testing

### Phase 9: Production Readiness
- [ ] Set up environment-specific configs
- [ ] Add database migrations system
- [ ] Set up logging (Winston or similar)
- [ ] Add monitoring/health checks
- [ ] Security audit
- [ ] Set up CI/CD (optional)

## 📊 Database Schema Overview

### Users Table
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR UNIQUE NOT NULL)
- `password_hash` (VARCHAR NOT NULL)
- `name` (VARCHAR)
- `phone` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Cars Table
- `id` (SERIAL PRIMARY KEY)
- `seller_id` (INT REFERENCES users(id))
- `make` (VARCHAR)
- `model` (VARCHAR)
- `year` (INT)
- `price` (DECIMAL)
- `body_type` (VARCHAR) - Sedan, SUV, Coupe, etc.
- `fuel_type` (VARCHAR) - Petrol, Diesel, Hybrid, Electric
- `transmission` (VARCHAR) - Automatic, Manual
- `engine` (VARCHAR)
- `color` (VARCHAR)
- `doors` (INT)
- `co2_emissions` (VARCHAR)
- `description` (TEXT)
- `image_urls` (JSONB or TEXT[]) - Array of image URLs
- `status` (VARCHAR) - active, sold, pending
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Favorites Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INT REFERENCES users(id))
- `car_id` (INT REFERENCES cars(id))
- `created_at` (TIMESTAMP)
- UNIQUE constraint on (user_id, car_id)

### Inquiries Table (Future)
- `id` (SERIAL PRIMARY KEY)
- `car_id` (INT REFERENCES cars(id))
- `buyer_id` (INT REFERENCES users(id))
- `seller_id` (INT REFERENCES users(id))
- `message` (TEXT)
- `created_at` (TIMESTAMP)

## 🔐 Security Considerations

- [ ] Password hashing with bcrypt (salt rounds: 10-12)
- [ ] JWT token expiration
- [ ] CORS configuration
- [ ] Input sanitization
- [ ] SQL injection prevention (parameterized queries)
- [ ] File upload validation
- [ ] Rate limiting
- [ ] HTTPS in production

## 🚀 Next Steps

1. **Start with Phase 2**: Set up the database and create the schema
2. **Then Phase 3**: Implement authentication (foundation for protected routes)
3. **Then Phase 4**: Implement car listings (core functionality)
4. **Then Phase 5**: User features (favorites, profile)
5. **Then Phase 6**: Image handling
6. **Continue with remaining phases** as needed

## 📝 Notes

- All placeholder files have TODO comments indicating what needs to be implemented
- Follow the same patterns as MicroApp backend for consistency
- Use PostgreSQL for production (can use SQLite for local dev if preferred)
- Consider using a migration tool (like `node-pg-migrate`) for production
- Image storage: Start with local filesystem, can migrate to S3/cloud storage later
