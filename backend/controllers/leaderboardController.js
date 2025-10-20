import pool from "../config/db.js";

/**
 * GET /api/leaderboard
 * Optional: ?limit=10|50 (defaults 50, max 50)
 * ORDER BY level DESC, xp DESC
 */
export async function getLeaderboard(req, res) {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || "50", 10), 50));
    const { rows } = await pool.query(
      `SELECT id, username, level, xp
       FROM users
       ORDER BY level DESC, xp DESC
       LIMIT $1`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    console.error("getLeaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
