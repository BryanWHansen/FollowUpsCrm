require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function runMigrations() {
  console.log("Starting database migrations...");
  console.log("Environment:", process.env.NODE_ENV);

  const migrationsDir = path.join(__dirname, "../migrations");

  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    console.error(`Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  // Get all SQL files and sort them
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    await pool.end();
    return;
  }

  console.log(`Found ${files.length} migration files to execute.\n`);

  try {
    for (const file of files) {
      console.log(`📄 Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");

      try {
        await pool.query(sql);
        console.log(`✅ Completed: ${file}\n`);
      } catch (err) {
        // Check if error is just "table already exists"
        if (err.code === "42P07") {
          console.log(`⚠️  Table already exists (skipping): ${file}\n`);
        } else {
          throw err;
        }
      }
    }

    console.log("🎉 All migrations completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    console.error("Details:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
