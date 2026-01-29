const db = require("./db");
require("dotenv").config();

async function seedSampleData() {
  console.log("🌱 Seeding sample data for AutoMarket...");

  try {
    // 1) Create or reuse a demo seller user
    const { rows: userRows } = await db.query(
      `
      INSERT INTO users (email, password_hash, name, phone)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `,
      [
        "dealer@example.com",
        // Simple placeholder hash; you can replace with a real bcrypt hash if you want to log in as this user.
        "seed-password-hash",
        "Sample Dealer",
        "+233555000111",
      ]
    );

    const sellerId = userRows[0].id;
    console.log(`✅ Seller user ready with id=${sellerId}`);

    // 2) Wipe existing demo data (optional: comment these out if you want to keep old data)
    await db.query("DELETE FROM favorites");
    await db.query("DELETE FROM inquiries");
    await db.query("DELETE FROM cars");
    await db.query("DELETE FROM bikes");
    await db.query("DELETE FROM trucks");
    await db.query("DELETE FROM parts");

    console.log("🧹 Cleared existing listings/favorites/inquiries");

    // Helper to parse price
    const parsePrice = (value) =>
      typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;

    // 3) Seed sample cars
    console.log("🚗 Inserting sample cars...");
    await db.query(
      `
      INSERT INTO cars (
        seller_id, make, model, year, price, body_type, fuel_type,
        transmission, engine, color, doors, co2_emissions, description,
        image_urls, status, mileage, location, vin_number, equipment,
        cylindrics, hp_kw, is_best_offer
      )
      VALUES
      ($1,'Mercedes-Benz','G-Wagon',2022,$2,'SUV','Petrol',
       'Automatic','4000 cm³ (310 kW / 416 HP)','Black',5,'289 g/km',
       'Luxury off-road SUV with premium interior',
       ARRAY['https://placehold.co/800x600?text=G-Wagon'], 'active',
       15000,'Accra, Ghana','VIN1234567890',
       ARRAY['abs','esp','aircon'],4000,'310 kW / 416 HP',true),
      ($1,'Toyota','Camry',2021,$3,'Sedan','Petrol',
       'Automatic','2500 cm³ (152 kW / 204 HP)','White',4,'150 g/km',
       'Reliable family sedan with great fuel economy',
       ARRAY['https://placehold.co/800x600?text=Camry'], 'active',
       32000,'Kumasi, Ghana','VIN9876543210',
       ARRAY['abs','aircon'],2500,'152 kW / 204 HP',false)
    `,
      [sellerId, parsePrice("780000"), parsePrice("220000")]
    );

    // 4) Seed sample bikes
    console.log("🏍️ Inserting sample bikes...");
    await db.query(
      `
      INSERT INTO bikes (
        seller_id, make, model, year, price, body_type, fuel_type,
        transmission, engine, color, co2_emissions, description,
        image_urls, status, mileage, location, vin_number, equipment,
        cylindrics, hp_kw, is_best_offer
      )
      VALUES
      ($1,'Yamaha','MT-07',2020,$2,'Sport','Petrol',
       'Manual','689 cm³ (55 kW / 74 HP)','Blue','105 g/km',
       'Agile naked bike perfect for city and weekend rides',
       ARRAY['https://placehold.co/800x600?text=MT-07'], 'active',
       8000,'Accra, Ghana','BIKEVIN123',
       ARRAY['abs'],689,'55 kW / 74 HP',false)
    `,
      [sellerId, parsePrice("65000")]
    );

    // 5) Seed sample trucks
    console.log("🚚 Inserting sample trucks...");
    await db.query(
      `
      INSERT INTO trucks (
        seller_id, make, model, year, price, body_type, fuel_type,
        transmission, engine, color, doors, co2_emissions, description,
        image_urls, status, mileage, location, vin_number, equipment,
        cylindrics, hp_kw, is_best_offer
      )
      VALUES
      ($1,'Ford','F-150',2019,$2,'Pickup','Diesel',
       'Automatic','3300 cm³ (186 kW / 250 HP)','Silver',4,'220 g/km',
       'Durable pickup truck with great towing capacity',
       ARRAY['https://placehold.co/800x600?text=F-150'], 'active',
       60000,'Takoradi, Ghana','TRUCKVIN123',
       ARRAY['tow','traction'],3300,'186 kW / 250 HP',false)
    `,
      [sellerId, parsePrice("300000")]
    );

    // 6) Seed sample parts
    console.log("🔧 Inserting sample parts...");
    await db.query(
      `
      INSERT INTO parts (
        seller_id, name, price, category, brand, compatibility,
        condition, warranty, description, image_urls, status, location,
        is_best_offer
      )
      VALUES
      ($1,'Premium Brake Pads', $2, 'Braking System', 'Bosch',
       'Compatible with multiple Toyota and Honda models',
       'New','24 months',
       'High performance brake pads with low dust and noise',
       ARRAY['https://placehold.co/800x600?text=Brake+Pads'],'active',
       'Accra, Ghana',false),
      ($1,'Engine Oil 5W-30', $3, 'Engine Parts', 'Castrol',
       'Suitable for most modern petrol engines',
       'New','12 months',
       'Fully synthetic engine oil for extended engine life',
       ARRAY['https://placehold.co/800x600?text=Engine+Oil'],'active',
       'Kumasi, Ghana',false)
    `,
      [sellerId, parsePrice("800"), parsePrice("350")]
    );

    console.log("✅ Sample data seeded successfully.");
  } catch (error) {
    console.error("❌ Failed to seed sample data:", error);
    throw error;
  } finally {
    // db pool is managed in db.js; let the process exit naturally
  }
}

if (require.main === module) {
  seedSampleData()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = seedSampleData;

