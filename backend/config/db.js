// backend/config/db.js
import pg from "pg";
const { Pool } = pg;

// Accept DATABASE_URL, DBURL, or fall back to a sane local default
const connectionString =
  process.env.DATABASE_URL ||
  process.env.DBURL ||
  "postgresql://coderank_user:0921@127.0.0.1:5432/coderank";

// Handle SSL if PGSSLMODE=require (e.g., Render/Heroku)
const ssl =
  String(process.env.PGSSLMODE || "").toLowerCase() === "require"
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool({
  connectionString,
  ssl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
  console.error("[db] unexpected error on idle client", err);
  process.exit(1);
});

export default pool;

