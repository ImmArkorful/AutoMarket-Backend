const bcrypt = require("bcrypt");
const db = require("./db");

async function seedDemoSeller() {
  const email = "e.arkorful3@gmail.com";
  const plainPassword = "Seller123!";
  const name = "Demo Seller";
  const phone = "+233200000000";

  try {
    console.log("🌱 Seeding demo seller and cars for:", email);

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const userResult = await db.query(
      `
      INSERT INTO users (email, password_hash, name, phone, role)
      VALUES ($1, $2, $3, $4, 'user')
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        phone = EXCLUDED.phone
      RETURNING id, email;
    `,
      [email, passwordHash, name, phone]
    );

    const sellerId = userResult.rows[0].id;
    console.log("✅ Seller ready with id:", sellerId);
    console.log("   Login email:", email);
    console.log("   Login password:", plainPassword);

    // Clear existing demo cars for this seller
    await db.query("DELETE FROM cars WHERE seller_id = $1;", [sellerId]);

    const demoCars = [
      {
        make: "Toyota",
        model: "Corolla",
        year: 2018,
        price: 120000,
        body_type: "Sedan",
        fuel_type: "Petrol",
        transmission: "Automatic",
        mileage: 65000,
        location: "Accra",
        status: "active",
      },
      {
        make: "Hyundai",
        model: "Tucson",
        year: 2020,
        price: 230000,
        body_type: "SUV",
        fuel_type: "Diesel",
        transmission: "Automatic",
        mileage: 42000,
        location: "Tema",
        status: "active",
      },
      {
        make: "Nissan",
        model: "Navara",
        year: 2019,
        price: 210000,
        body_type: "Pickup",
        fuel_type: "Diesel",
        transmission: "Manual",
        mileage: 88000,
        location: "Kumasi",
        status: "draft",
      },
    ];

    let inserted = 0;

    for (const car of demoCars) {
      const result = await db.query(
        `
        INSERT INTO cars (
          seller_id,
          make,
          model,
          year,
          price,
          body_type,
          fuel_type,
          transmission,
          mileage,
          location,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, make, model, year, price, status;
      `,
        [
          sellerId,
          car.make,
          car.model,
          car.year,
          car.price,
          car.body_type,
          car.fuel_type,
          car.transmission,
          car.mileage,
          car.location,
          car.status,
        ]
      );

      const row = result.rows[0];
      inserted += 1;
      console.log(
        `   • Car #${inserted}:`,
        `${row.make} ${row.model} ${row.year} – GHS ${row.price} (${row.status})`
      );
    }

    console.log(`\n✅ Seed complete. Inserted ${inserted} demo cars for ${email}.`);
  } catch (error) {
    console.error("❌ Failed to seed demo seller:", error.message);
    throw error;
  }
}

if (require.main === module) {
  seedDemoSeller()
    .then(() => {
      console.log("\n🎉 Demo seller seeding finished.");
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = seedDemoSeller;

