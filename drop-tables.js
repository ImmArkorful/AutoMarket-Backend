const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT || 5432,
});

async function dropTables() {
  const client = await pool.connect();

  try {
    console.log("🗑️  Dropping tables (keeping users table)...");
    console.log("🔌 Connected to database:", process.env.PG_DATABASE);
    console.log();

    // Drop triggers first (they depend on tables)
    console.log("Dropping triggers...");
    try {
      await client.query(`DROP TRIGGER IF EXISTS update_users_updated_at ON users;`);
      await client.query(`DROP TRIGGER IF EXISTS update_cars_updated_at ON cars;`);
      console.log("✅ Triggers dropped");
    } catch (error) {
      console.log("⚠️  Error dropping triggers (may not exist):", error.message);
    }

    // Drop the update function
    console.log("\nDropping update timestamp function...");
    try {
      await client.query(`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;`);
      console.log("✅ Update timestamp function dropped");
    } catch (error) {
      console.log("⚠️  Error dropping function (may not exist):", error.message);
    }

    // Drop tables in reverse order of dependencies (CASCADE will handle foreign keys)
    // Order: inquiries -> favorites -> cars (all reference users, but we're keeping users)
    console.log("\nDropping tables...");

    // Drop inquiries table
    console.log("Dropping inquiries table...");
    try {
      await client.query(`DROP TABLE IF EXISTS inquiries CASCADE;`);
      console.log("✅ Inquiries table dropped");
    } catch (error) {
      console.log("⚠️  Error dropping inquiries table:", error.message);
    }

    // Drop favorites table
    console.log("Dropping favorites table...");
    try {
      await client.query(`DROP TABLE IF EXISTS favorites CASCADE;`);
      console.log("✅ Favorites table dropped");
    } catch (error) {
      console.log("⚠️  Error dropping favorites table:", error.message);
    }

    // Drop cars table
    console.log("Dropping cars table...");
    try {
      await client.query(`DROP TABLE IF EXISTS cars CASCADE;`);
      console.log("✅ Cars table dropped");
    } catch (error) {
      console.log("⚠️  Error dropping cars table:", error.message);
    }

    // Drop indexes (they should be dropped automatically with tables, but just in case)
    console.log("\nDropping indexes...");
    const indexes = [
      "idx_inquiries_created_at",
      "idx_inquiries_seller_id",
      "idx_inquiries_buyer_id",
      "idx_inquiries_car_id",
      "idx_favorites_car_id",
      "idx_favorites_user_id",
      "idx_cars_created_at",
      "idx_cars_fuel_type",
      "idx_cars_body_type",
      "idx_cars_make_model",
      "idx_cars_year",
      "idx_cars_price",
      "idx_cars_status",
      "idx_cars_seller_id",
    ];

    for (const index of indexes) {
      try {
        await client.query(`DROP INDEX IF EXISTS ${index};`);
      } catch (error) {
        // Index might not exist or already dropped with table
      }
    }
    console.log("✅ Indexes dropped (if they existed)");

    console.log("\n✅ All tables dropped successfully (users table preserved)!");
    console.log("\n📊 Remaining tables:");
    const remainingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    remainingTables.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

  } catch (error) {
    console.error("\n❌ Error dropping tables:", error);
    console.error("Error details:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  console.log("⚠️  WARNING: This will delete all tables except the users table!");
  console.log("⚠️  This action cannot be undone!");
  console.log("\nPress Ctrl+C to cancel, or wait 3 seconds to continue...\n");

  setTimeout(async () => {
    dropTables()
      .then(() => {
        console.log("\n🎉 Cleanup completed successfully!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n💥 Cleanup failed:", error);
        process.exit(1);
      });
  }, 3000);
}

module.exports = dropTables;
