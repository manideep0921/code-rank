import pool from "../config/db.js";
const { rows } = await pool.query("SELECT id, title, slug, difficulty FROM problems ORDER BY id ASC");
console.log(rows);
await pool.end();
