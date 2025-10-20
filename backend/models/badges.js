// backend/models/badges.js
import pool from "../config/db.js";

export async function listForUser(userId) {
  const { rows } = await pool.query(
    `SELECT b.id::text, b.slug, b.name, b.description, b.icon, ub.awarded_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
      WHERE ub.user_id=$1
      ORDER BY ub.awarded_at DESC`,
    [userId]
  );
  return rows;
}

export async function awardBySlug(userId, slug) {
  const { rows: badge } = await pool.query("SELECT id FROM badges WHERE slug=$1", [slug]);
  if (!badge.length) return null;
  try {
    const { rows } = await pool.query(
      `INSERT INTO user_badges (user_id, badge_id)
       VALUES ($1,$2)
       ON CONFLICT DO NOTHING
       RETURNING user_id::text, badge_id::text, awarded_at`,
      [userId, badge[0].id]
    );
    return rows[0] || null;
  } catch {
    return null;
  }
}
