# Backend Testing Guide

This document describes how to test the AutoMarket backend API.

## Prerequisites

1. **Database Setup**: Make sure PostgreSQL is running and the database is set up:
   ```bash
   npm run setup
   ```

2. **Dependencies**: Install all dependencies:
   ```bash
   npm install
   ```

3. **Environment Variables**: Make sure your `.env` file is configured with:
   - Database credentials (PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD)
   - JWT_SECRET
   - PORT (default: 3001)

4. **Server Running**: Start the server:
   ```bash
   npm start
   # or for development:
   npm run dev
   ```

## Running Tests

### Automated End-to-End Tests

Run the comprehensive test suite:

```bash
npm test
```

Or directly:
```bash
node test-backend.js
```

The test script will test:
1. ✅ Health check endpoints
2. ✅ User registration
3. ✅ User login
4. ✅ Get current user
5. ✅ Create car listing
6. ✅ Get all cars (with pagination)
7. ✅ Get single car
8. ✅ Update car listing
9. ✅ Get user profile
10. ✅ Get user listings
11. ✅ Add to favorites
12. ✅ Get favorites
13. ✅ Remove from favorites
14. ✅ Delete car listing

### Configure Test URL

By default, tests run against `http://localhost:3001`. To test against a different URL:

```bash
TEST_URL=http://your-server:3001 node test-backend.js
```

Or add to `.env`:
```env
TEST_URL=http://localhost:3001
```

## Manual Testing with curl

### Health Check
```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/health
```

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "phone": "+1234567890"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Current User (replace TOKEN with actual token)
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Create Car Listing
```bash
curl -X POST http://localhost:3001/api/cars \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "price": 18000,
    "body_type": "Sedan",
    "fuel_type": "Petrol",
    "transmission": "Automatic",
    "engine": "1800 cm³",
    "color": "White",
    "doors": 4,
    "co2_emissions": "120 g/km",
    "description": "Excellent condition",
    "image_urls": ["/images/car1.jpg"]
  }'
```

### Get All Cars
```bash
curl "http://localhost:3001/api/cars?page=1&limit=20&minPrice=10000&maxPrice=50000"
```

### Get Single Car
```bash
curl http://localhost:3001/api/cars/1
```

### Update Car Listing
```bash
curl -X PUT http://localhost:3001/api/cars/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "price": 17000,
    "description": "Price reduced!"
  }'
```

### Get User Profile
```bash
curl http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer TOKEN"
```

### Get User Listings
```bash
curl "http://localhost:3001/api/user/listings?page=1&limit=20" \
  -H "Authorization: Bearer TOKEN"
```

### Add to Favorites
```bash
curl -X POST http://localhost:3001/api/user/favorites/1 \
  -H "Authorization: Bearer TOKEN"
```

### Get Favorites
```bash
curl "http://localhost:3001/api/user/favorites?page=1&limit=20" \
  -H "Authorization: Bearer TOKEN"
```

### Remove from Favorites
```bash
curl -X DELETE http://localhost:3001/api/user/favorites/1 \
  -H "Authorization: Bearer TOKEN"
```

### Delete Car Listing
```bash
curl -X DELETE http://localhost:3001/api/cars/1 \
  -H "Authorization: Bearer TOKEN"
```

## Using Postman or Insomnia

1. Import the endpoints into your API client
2. Set up environment variables:
   - `base_url`: `http://localhost:3001`
   - `token`: (set after login/register)
3. Register/Login first to get the token
4. Use the token in the Authorization header for protected routes

## Expected Results

### Successful Response Format

Most endpoints return JSON in this format:

**Single Resource:**
```json
{
  "car": { ... }
}
```

**List with Pagination:**
```json
{
  "cars": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 100,
    "totalPages": 5,
    "hasMore": true
  }
}
```

**Success Message:**
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "error": "Error message here"
}
```

## Troubleshooting

### Tests Failing

1. **Server not running**: Make sure the server is running on the correct port
2. **Database not set up**: Run `npm run setup` to create tables
3. **Database connection issues**: Check your `.env` file credentials
4. **Port already in use**: Change PORT in `.env` or stop other services

### Common Errors

- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Valid token but insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Check server logs for details

### Debugging

Enable verbose logging by checking server console output. The server logs all requests using morgan.

For more detailed debugging, check the server logs in the terminal where `npm start` or `npm run dev` is running.
