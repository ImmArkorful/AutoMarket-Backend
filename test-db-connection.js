const { Pool } = require("pg");
require("dotenv").config();

async function testConnection() {
  const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST || "localhost",
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT || 5432,
  });

  try {
    console.log("🔌 Testing database connection...");
    console.log("\n📋 Connection Details:");
    console.log(`   Host: ${process.env.PG_HOST || "localhost"}`);
    console.log(`   Port: ${process.env.PG_PORT || 5432}`);
    console.log(`   Database: ${process.env.PG_DATABASE || "not set"}`);
    console.log(`   User: ${process.env.PG_USER || "not set"}`);
    console.log(`   Password: ${process.env.PG_PASSWORD ? "***" : "not set"}`);
    console.log();

    // Test the connection with a simple query
    const result = await pool.query("SELECT NOW() as current_time, version() as postgres_version");
    
    console.log("✅ Database connection successful!");
    console.log(`\n📊 Server Time: ${result.rows[0].current_time}`);
    console.log(`📦 PostgreSQL Version: ${result.rows[0].postgres_version.split(',')[0]}`);
    
    // Test if we can query pg_database to see available databases
    const dbResult = await pool.query("SELECT datname FROM pg_database WHERE datistemplate = false");
    console.log(`\n📚 Available databases: ${dbResult.rows.map(r => r.datname).join(", ")}`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Database connection failed!");
    console.error("\nError details:");
    console.error(`   Code: ${error.code}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.code === "ECONNREFUSED") {
      console.error("\n💡 Troubleshooting:");
      console.error("   - Make sure PostgreSQL is running");
      console.error("   - Check that the host and port are correct");
      console.error("   - Try: sudo service postgresql start (Linux) or brew services start postgresql (Mac)");
    } else if (error.code === "28P01") {
      console.error("\n💡 Troubleshooting:");
      console.error("   - Check your username and password in .env file");
      console.error("   - Verify the user has access to the database");
    } else if (error.code === "3D000") {
      console.error("\n💡 Troubleshooting:");
      console.error("   - Database does not exist");
      console.error(`   - Create the database first: CREATE DATABASE ${process.env.PG_DATABASE};`);
    } else if (!process.env.PG_DATABASE || !process.env.PG_USER || !process.env.PG_PASSWORD) {
      console.error("\n💡 Troubleshooting:");
      console.error("   - Make sure .env file exists and has all required variables");
      console.error("   - Required: PG_DATABASE, PG_USER, PG_PASSWORD");
    }
    
    await pool.end();
    process.exit(1);
  }
}

// Run the test
testConnection();
