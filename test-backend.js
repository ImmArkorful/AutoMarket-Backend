const axios = require("axios");
require("dotenv").config();

const BASE_URL = process.env.TEST_URL || "http://localhost:3001";
let authToken = null;
let testUserId = null;
let testCarId = null;

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${"=".repeat(60)}`, "blue");
  log(`🧪 Testing: ${testName}`, "blue");
  log("=".repeat(60), "blue");
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "yellow");
}

// Test helper function
async function testEndpoint(name, method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
    };
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  logTest("Health Check");
  const result = await testEndpoint("Health Check", "GET", "/health");
  if (result.success) {
    logSuccess("Server is running");
    logInfo(`Status: ${result.data.status}`);
    return true;
  } else {
    logError(`Health check failed: ${result.error}`);
    return false;
  }
}

// Test 2: API Health Check
async function testApiHealth() {
  logTest("API Health Check");
  const result = await testEndpoint("API Health", "GET", "/api/health");
  if (result.success) {
    logSuccess("API is accessible");
    logInfo(`Message: ${result.data.message}`);
    return true;
  } else {
    logError(`API health check failed: ${result.error}`);
    return false;
  }
}

// Test 3: Register User
async function testRegister() {
  logTest("User Registration");
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = "testpassword123";
  const testName = "Test User";
  const testPhone = "+1234567890";

  const result = await testEndpoint(
    "Register",
    "POST",
    "/api/auth/register",
    {
      email: testEmail,
      password: testPassword,
      name: testName,
      phone: testPhone,
    }
  );

  if (result.success && result.data.token) {
    logSuccess("User registered successfully");
    logInfo(`Email: ${testEmail}`);
    logInfo(`User ID: ${result.data.user.id}`);
    authToken = result.data.token;
    testUserId = result.data.user.id;
    return true;
  } else {
    logError(`Registration failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 4: Login User
async function testLogin() {
  logTest("User Login");
  // First register a user
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = "testpassword123";

  await testEndpoint("Register for Login", "POST", "/api/auth/register", {
    email: testEmail,
    password: testPassword,
    name: "Test User",
  });

  const result = await testEndpoint("Login", "POST", "/api/auth/login", {
    email: testEmail,
    password: testPassword,
  });

  if (result.success && result.data.token) {
    logSuccess("User logged in successfully");
    logInfo(`Email: ${testEmail}`);
    if (!authToken) {
      authToken = result.data.token;
      testUserId = result.data.user.id;
    }
    return true;
  } else {
    logError(`Login failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 5: Get Current User (Me)
async function testGetMe() {
  logTest("Get Current User");
  if (!authToken) {
    logError("No auth token available. Run registration/login first.");
    return false;
  }

  const result = await testEndpoint("Get Me", "GET", "/api/auth/me", null, authToken);

  if (result.success && result.data.user) {
    logSuccess("Retrieved current user");
    logInfo(`User ID: ${result.data.user.id}`);
    logInfo(`Email: ${result.data.user.email}`);
    logInfo(`Name: ${result.data.user.name || "N/A"}`);
    return true;
  } else {
    logError(`Get me failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 6: Create Car Listing
async function testCreateCar() {
  logTest("Create Car Listing");
  if (!authToken) {
    logError("No auth token available. Run registration/login first.");
    return false;
  }

  const carData = {
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    price: 18000,
    body_type: "Sedan",
    fuel_type: "Petrol",
    transmission: "Automatic",
    engine: "1800 cm³ (150 kW / 200 HP)",
    color: "White",
    doors: 4,
    co2_emissions: "120 g/km",
    description: "Excellent condition, well maintained",
    image_urls: ["/images/car1.jpg"],
    status: "active",
  };

  const result = await testEndpoint(
    "Create Car",
    "POST",
    "/api/cars",
    carData,
    authToken
  );

  if (result.success && result.data.car) {
    logSuccess("Car listing created successfully");
    logInfo(`Car ID: ${result.data.car.id}`);
    logInfo(`Model: ${result.data.car.model} ${result.data.car.year}`);
    logInfo(`Price: $${result.data.car.price}`);
    testCarId = result.data.car.id;
    return true;
  } else {
    logError(`Create car failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 7: Get All Cars
async function testGetAllCars() {
  logTest("Get All Cars");
  const result = await testEndpoint("Get All Cars", "GET", "/api/cars?page=1&limit=10");

  if (result.success && result.data.cars) {
    logSuccess(`Retrieved ${result.data.cars.length} cars`);
    logInfo(`Total: ${result.data.pagination.totalCount}`);
    logInfo(`Page: ${result.data.pagination.page}/${result.data.pagination.totalPages}`);
    return true;
  } else {
    logError(`Get all cars failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 8: Get Single Car
async function testGetSingleCar() {
  logTest("Get Single Car");
  if (!testCarId) {
    logError("No car ID available. Run create car first.");
    return false;
  }

  const result = await testEndpoint("Get Single Car", "GET", `/api/cars/${testCarId}`);

  if (result.success && result.data.car) {
    logSuccess("Retrieved car details");
    logInfo(`Car ID: ${result.data.car.id}`);
    logInfo(`Model: ${result.data.car.model}`);
    logInfo(`Seller: ${result.data.car.seller?.name || "N/A"}`);
    return true;
  } else {
    logError(`Get single car failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 9: Update Car Listing
async function testUpdateCar() {
  logTest("Update Car Listing");
  if (!authToken || !testCarId) {
    logError("No auth token or car ID available.");
    return false;
  }

  const updateData = {
    price: 17000,
    description: "Price reduced! Well maintained car.",
  };

  const result = await testEndpoint(
    "Update Car",
    "PUT",
    `/api/cars/${testCarId}`,
    updateData,
    authToken
  );

  if (result.success && result.data.car) {
    logSuccess("Car listing updated successfully");
    logInfo(`New Price: $${result.data.car.price}`);
    logInfo(`Description: ${result.data.car.description}`);
    return true;
  } else {
    logError(`Update car failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 10: Get User Profile
async function testGetProfile() {
  logTest("Get User Profile");
  if (!authToken) {
    logError("No auth token available.");
    return false;
  }

  const result = await testEndpoint(
    "Get Profile",
    "GET",
    "/api/user/profile",
    null,
    authToken
  );

  if (result.success && result.data.user) {
    logSuccess("Retrieved user profile");
    logInfo(`User ID: ${result.data.user.id}`);
    logInfo(`Email: ${result.data.user.email}`);
    logInfo(`Total Listings: ${result.data.stats.total_listings}`);
    logInfo(`Total Favorites: ${result.data.stats.total_favorites}`);
    return true;
  } else {
    logError(`Get profile failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 11: Get User Listings
async function testGetUserListings() {
  logTest("Get User Listings");
  if (!authToken) {
    logError("No auth token available.");
    return false;
  }

  const result = await testEndpoint(
    "Get User Listings",
    "GET",
    "/api/user/listings?page=1&limit=10",
    null,
    authToken
  );

  if (result.success && result.data.listings) {
    logSuccess(`Retrieved ${result.data.listings.length} listings`);
    logInfo(`Total: ${result.data.pagination.totalCount}`);
    return true;
  } else {
    logError(`Get user listings failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 12: Add to Favorites
async function testAddFavorite() {
  logTest("Add to Favorites");
  if (!authToken || !testCarId) {
    logError("No auth token or car ID available.");
    return false;
  }

  const result = await testEndpoint(
    "Add Favorite",
    "POST",
    `/api/user/favorites/${testCarId}`,
    null,
    authToken
  );

  if (result.success) {
    logSuccess("Car added to favorites successfully");
    return true;
  } else {
    logError(`Add favorite failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 13: Get Favorites
async function testGetFavorites() {
  logTest("Get Favorites");
  if (!authToken) {
    logError("No auth token available.");
    return false;
  }

  const result = await testEndpoint(
    "Get Favorites",
    "GET",
    "/api/user/favorites?page=1&limit=10",
    null,
    authToken
  );

  if (result.success && result.data.favorites) {
    logSuccess(`Retrieved ${result.data.favorites.length} favorites`);
    logInfo(`Total: ${result.data.pagination.totalCount}`);
    return true;
  } else {
    logError(`Get favorites failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 14: Remove from Favorites
async function testRemoveFavorite() {
  logTest("Remove from Favorites");
  if (!authToken || !testCarId) {
    logError("No auth token or car ID available.");
    return false;
  }

  const result = await testEndpoint(
    "Remove Favorite",
    "DELETE",
    `/api/user/favorites/${testCarId}`,
    null,
    authToken
  );

  if (result.success) {
    logSuccess("Car removed from favorites successfully");
    return true;
  } else {
    logError(`Remove favorite failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 15: Delete Car Listing
async function testDeleteCar() {
  logTest("Delete Car Listing");
  if (!authToken || !testCarId) {
    logError("No auth token or car ID available.");
    return false;
  }

  const result = await testEndpoint(
    "Delete Car",
    "DELETE",
    `/api/cars/${testCarId}`,
    null,
    authToken
  );

  if (result.success) {
    logSuccess("Car listing deleted successfully");
    testCarId = null; // Reset for cleanup
    return true;
  } else {
    logError(`Delete car failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log("\n" + "=".repeat(60), "blue");
  log("🚀 Starting AutoMarket Backend End-to-End Tests", "blue");
  log("=".repeat(60), "blue");
  log(`📍 Base URL: ${BASE_URL}\n`, "yellow");

  const tests = [
    { name: "Health Check", fn: testHealthCheck },
    { name: "API Health Check", fn: testApiHealth },
    { name: "User Registration", fn: testRegister },
    { name: "User Login", fn: testLogin },
    { name: "Get Current User", fn: testGetMe },
    { name: "Create Car Listing", fn: testCreateCar },
    { name: "Get All Cars", fn: testGetAllCars },
    { name: "Get Single Car", fn: testGetSingleCar },
    { name: "Update Car Listing", fn: testUpdateCar },
    { name: "Get User Profile", fn: testGetProfile },
    { name: "Get User Listings", fn: testGetUserListings },
    { name: "Add to Favorites", fn: testAddFavorite },
    { name: "Get Favorites", fn: testGetFavorites },
    { name: "Remove from Favorites", fn: testRemoveFavorite },
    { name: "Delete Car Listing", fn: testDeleteCar },
  ];

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  for (const test of tests) {
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      logError(`Test ${test.name} threw an error: ${error.message}`);
      results.failed++;
    }
  }

  // Summary
  log("\n" + "=".repeat(60), "blue");
  log("📊 Test Summary", "blue");
  log("=".repeat(60), "blue");
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }
  logInfo(`Total: ${results.passed + results.failed}`);
  log("=".repeat(60) + "\n", "blue");

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  logError(`Test runner error: ${error.message}`);
  process.exit(1);
});
