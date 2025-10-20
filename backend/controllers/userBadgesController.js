import pool from "../config/db.js";

/** Parse int safely */
function toInt(v) {
  const n = parseInt(String(v ?? "").trim(), 10);
  return Number.isFinite(n) ? n : NaN;
}
/** Primary (modern) query: expects badges.slug + badges.icon */
const QUERY_MODERN = `
  SELECT b.id AS badge_id, b.slug, b.name, b.description, b.icon, ub.awarded_at
  FROM user_badges ub
  JOIN badges b ON b.id = ub.badge_id
  WHERE ub.user_id = $1
  ORDER BY ub.awarded_at DESC
`;

/** Fallback (legacy) query: badges has no slug/icon; may have level_required */
const QUERY_LEGACY = `
  SELECT
    b.id AS badge_id,
    NULL::text AS slug,
    b.name,
    b.description,
    NULL::text AS icon,
    ub.awarded_at
  FROM user_badges ub
  JOIN badges b ON b.id = ub.badge_id
  WHERE ub.user_id = $1
  ORDER BY ub.awarded_at DESC
`;

async function fetchBadges(userId) {
  try {
    const { rows } = await pool.query(QUERY_MODERN, [userId]);
    return rows;
  } catch (err) {
    // If column does not exist, fall back to legacy layout
    if (String(err?.code) === "42703" || (err?.message || "").includes("does not exist")) {
      const { rows } = await pool.query(QUERY_LEGACY, [userId]);
      return rows;
    }
    throw err;
  }
}

/** GET /api/userBadges?user_id=123 */
export async function getUserBadgesByQuery(req, res) {
  try {
    const userId = toInt(req.query.user_id);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: "Invalid or missing user_id" });
    }
    const rows = await fetchBadges(userId);
    return res.json(rows); // possibly []
  } catch (err) {
    console.error("getUserBadgesByQuery error:", err?.message || err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/** GET /api/userBadges/:id */
export async function getUserBadgesByParam(req, res) {
  try {
    const userId = toInt(req.params.id);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const rows = await fetchBadges(userId);
    return res.json(rows); // possibly []
  } catch (err) {
    console.error("getUserBadgesByParam error:", err?.message || err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
