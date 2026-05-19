// backend/src/services/db.ts
import dotenv from "dotenv";
import { Pool } from "pg";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,           // ✅ Neon requires low max client count
  idleTimeoutMillis: 5000, // ✅ Prevents "connection terminated"
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected PG client error", err);
});

export { pool };
