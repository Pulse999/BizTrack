// backend/src/index.ts

// Load environment variables FIRST
import dotenv from "dotenv";
dotenv.config();

// Validate required environment variables
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error(
    "FATAL: Missing JWT_SECRET. Set JWT_SECRET in your environment."
  );
  process.exit(1);
}

if (jwtSecret.length < 32) {
  console.warn(
    "Warning: JWT_SECRET is shorter than 32 characters."
  );
}

// Import the Express app
import app from "./app";

const PORT = Number(process.env.PORT) || 5000;

// Helpful startup diagnostics
console.log("🌍 ENV CHECK:");
console.log("SUPABASE_URL =", process.env.SUPABASE_URL);
console.log("SUPABASE_CERT_BUCKET =", process.env.SUPABASE_CERT_BUCKET);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY =",
  process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10)
);

// Start Express
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log("✅ Running in LOCAL mode");
});