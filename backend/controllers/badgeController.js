import pool from "../config/db.js";

export async function giveBadge(userId, badgeName) {
  try {
    const badgeRes = await pool.query("SELECT id FROM badges WHERE name = $1", [badgeName]);
    if (!badgeRes.rows.length) {
      console.log("⚠️ Badge not found:", badgeName);
      return;
    }
    const badgeId = badgeRes.rows[0].id;

    await pool.query(
      `INSERT INTO user_badges (user_id, badge_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, badge_id) DO NOTHING`,
      [userId, badgeId]
    );

    console.log("🏅 Badge awarded:", badgeName, "to user", userId);
  } catch (err) {
    console.error("Error in giveBadge:", err);
  }
}
