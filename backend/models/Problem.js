// backend/models/problems.js
import pool from "../config/db.js";

export async function listAll() {
  const { rows } = await pool.query(
    "SELECT id::text, title, slug, difficulty, xp FROM problems ORDER BY id"
  );
  return rows;
}

export async function getById(id) {
  const { rows } = await pool.query(
    "SELECT id::text, title, slug, difficulty, xp FROM problems WHERE id=$1",
    [id]
  );
  return rows[0] || null;
}

export async function getBySlug(slug) {
  const { rows } = await pool.query(
    "SELECT id::text, title, slug, difficulty, xp FROM problems WHERE slug=$1",
    [slug]
  );
  return rows[0] || null;
}
