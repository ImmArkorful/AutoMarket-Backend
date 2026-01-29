const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT || 5432,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log("📦 Setting up AutoMarket database...");
    console.log("🔌 Connected to database:", process.env.PG_DATABASE);
    console.log();

    // Users table
    console.log("Creating users table...");
    const usersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(usersTableQuery);
    console.log("✅ Users table created/verified");

    // Ensure role column exists on existing databases
    await client.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'user';"
    );
    console.log("✅ Users.role column created/verified");

    // Cars/Listings table
    console.log("Creating cars table...");
    const carsTableQuery = `
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        seller_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        make VARCHAR(100),
        model VARCHAR(255) NOT NULL,
        year INT NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        body_type VARCHAR(50),
        fuel_type VARCHAR(50),
        transmission VARCHAR(50),
        engine VARCHAR(255),
        color VARCHAR(50),
        doors INT,
        co2_emissions VARCHAR(50),
        description TEXT,
        image_urls TEXT[] DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'active',
        mileage INT,
        location VARCHAR(255),
        vin_number VARCHAR(50),
        equipment TEXT[] DEFAULT '{}',
        cylindrics INT,
        hp_kw VARCHAR(100),
        is_best_offer BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(carsTableQuery);
    console.log("✅ Cars table created/verified");

    // Bikes table
    console.log("Creating bikes table...");
    const bikesTableQuery = `
      CREATE TABLE IF NOT EXISTS bikes (
        id SERIAL PRIMARY KEY,
        seller_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        make VARCHAR(100),
        model VARCHAR(255) NOT NULL,
        year INT NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        body_type VARCHAR(50),
        fuel_type VARCHAR(50),
        transmission VARCHAR(50),
        engine VARCHAR(255),
        color VARCHAR(50),
        co2_emissions VARCHAR(50),
        description TEXT,
        image_urls TEXT[] DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'active',
        mileage INT,
        location VARCHAR(255),
        vin_number VARCHAR(50),
        equipment TEXT[] DEFAULT '{}',
        cylindrics INT,
        hp_kw VARCHAR(100),
        is_best_offer BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(bikesTableQuery);
    console.log("✅ Bikes table created/verified");

    // Trucks table
    console.log("Creating trucks table...");
    const trucksTableQuery = `
      CREATE TABLE IF NOT EXISTS trucks (
        id SERIAL PRIMARY KEY,
        seller_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        make VARCHAR(100),
        model VARCHAR(255) NOT NULL,
        year INT NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        body_type VARCHAR(50),
        fuel_type VARCHAR(50),
        transmission VARCHAR(50),
        engine VARCHAR(255),
        color VARCHAR(50),
        doors INT,
        co2_emissions VARCHAR(50),
        description TEXT,
        image_urls TEXT[] DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'active',
        mileage INT,
        location VARCHAR(255),
        vin_number VARCHAR(50),
        equipment TEXT[] DEFAULT '{}',
        cylindrics INT,
        hp_kw VARCHAR(100),
        is_best_offer BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(trucksTableQuery);
    console.log("✅ Trucks table created/verified");

    // Parts table
    console.log("Creating parts table...");
    const partsTableQuery = `
      CREATE TABLE IF NOT EXISTS parts (
        id SERIAL PRIMARY KEY,
        seller_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        compatibility TEXT NOT NULL,
        condition VARCHAR(50) NOT NULL,
        warranty VARCHAR(100) NOT NULL,
        description TEXT,
        image_urls TEXT[] DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'active',
        location VARCHAR(255),
        is_best_offer BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(partsTableQuery);
    console.log("✅ Parts table created/verified");

    // Favorites table
    console.log("Creating favorites table...");
    const favoritesTableQuery = `
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        car_id INT REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, car_id)
      );
    `;
    await client.query(favoritesTableQuery);
    console.log("✅ Favorites table created/verified");

    // Inquiries/Messages table
    console.log("Creating inquiries table...");
    const inquiriesTableQuery = `
      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        car_id INT REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
        buyer_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        seller_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(inquiriesTableQuery);
    console.log("✅ Inquiries table created/verified");

    // Recently viewed table
    console.log("Creating recently_viewed table...");
    const recentlyViewedTableQuery = `
      CREATE TABLE IF NOT EXISTS recently_viewed (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        car_id INT REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, car_id)
      );
    `;
    await client.query(recentlyViewedTableQuery);
    console.log("✅ Recently viewed table created/verified");

    // Saved search alerts table
    console.log("Creating search_alerts table...");
    const searchAlertsTableQuery = `
      CREATE TABLE IF NOT EXISTS search_alerts (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        category VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category)
      );
    `;
    await client.query(searchAlertsTableQuery);
    console.log("✅ Search alerts table created/verified");

    // Create indexes for performance
    console.log("\nCreating indexes...");
    
    // Users table indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    console.log("✅ Index on users.email created/verified");

    // Cars table indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cars_seller_id ON cars(seller_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cars_year ON cars(year);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cars_make_model ON cars(make, model);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cars_body_type ON cars(body_type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cars_fuel_type ON cars(fuel_type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cars_created_at ON cars(created_at DESC);`);
    console.log("✅ Indexes on cars table created/verified");

    // Bikes table indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bikes_seller_id ON bikes(seller_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bikes_status ON bikes(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bikes_price ON bikes(price);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bikes_year ON bikes(year);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bikes_make_model ON bikes(make, model);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bikes_body_type ON bikes(body_type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bikes_fuel_type ON bikes(fuel_type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bikes_created_at ON bikes(created_at DESC);`);
    console.log("✅ Indexes on bikes table created/verified");

    // Trucks table indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trucks_seller_id ON trucks(seller_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trucks_price ON trucks(price);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trucks_year ON trucks(year);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trucks_make_model ON trucks(make, model);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trucks_body_type ON trucks(body_type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trucks_fuel_type ON trucks(fuel_type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trucks_created_at ON trucks(created_at DESC);`);
    console.log("✅ Indexes on trucks table created/verified");

    // Parts table indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_parts_seller_id ON parts(seller_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_parts_status ON parts(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_parts_price ON parts(price);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_parts_brand ON parts(brand);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_parts_created_at ON parts(created_at DESC);`);
    console.log("✅ Indexes on parts table created/verified");

    // Favorites table indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_favorites_car_id ON favorites(car_id);`);
    console.log("✅ Indexes on favorites table created/verified");

    // Inquiries table indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inquiries_car_id ON inquiries(car_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inquiries_buyer_id ON inquiries(buyer_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inquiries_seller_id ON inquiries(seller_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);`);
    console.log("✅ Indexes on inquiries table created/verified");

    // Recently viewed indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON recently_viewed(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_recently_viewed_car_id ON recently_viewed(car_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON recently_viewed(viewed_at DESC);`);
    console.log("✅ Indexes on recently_viewed table created/verified");

    // Search alerts indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_search_alerts_user_id ON search_alerts(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_search_alerts_category ON search_alerts(category);`);
    console.log("✅ Indexes on search_alerts table created/verified");

    // Create function to update updated_at timestamp
    console.log("\nCreating update timestamp function...");
    const updateTimestampFunction = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    await client.query(updateTimestampFunction);
    console.log("✅ Update timestamp function created/verified");

    // Create triggers to automatically update updated_at
    console.log("Creating triggers...");
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `);
    await client.query(`
      DROP TRIGGER IF EXISTS update_cars_updated_at ON cars;
      CREATE TRIGGER update_cars_updated_at 
        BEFORE UPDATE ON cars 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `);
    await client.query(`
      DROP TRIGGER IF EXISTS update_bikes_updated_at ON bikes;
      CREATE TRIGGER update_bikes_updated_at 
        BEFORE UPDATE ON bikes 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `);
    await client.query(`
      DROP TRIGGER IF EXISTS update_trucks_updated_at ON trucks;
      CREATE TRIGGER update_trucks_updated_at 
        BEFORE UPDATE ON trucks 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `);
    await client.query(`
      DROP TRIGGER IF EXISTS update_parts_updated_at ON parts;
      CREATE TRIGGER update_parts_updated_at 
        BEFORE UPDATE ON parts 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log("✅ Triggers created/verified");

    console.log("\n✅ Database setup complete!");
    console.log("\n📊 Summary:");
    console.log("   - Users table: Ready");
    console.log("   - Cars table: Ready");
    console.log("   - Bikes table: Ready");
    console.log("   - Trucks table: Ready");
    console.log("   - Parts table: Ready");
    console.log("   - Favorites table: Ready");
    console.log("   - Inquiries table: Ready");
    console.log("   - Recently viewed table: Ready");
    console.log("   - Search alerts table: Ready");
    console.log("   - Indexes: Created");
    console.log("   - Triggers: Created");
    
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    console.error("\nError details:", error.message);
    if (error.code === "3D000") {
      console.error("\n💡 Database does not exist. Create it first:");
      console.error(`   CREATE DATABASE ${process.env.PG_DATABASE};`);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log("\n🎉 Setup completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Setup failed:", error);
      process.exit(1);
    });
}

module.exports = setupDatabase;
