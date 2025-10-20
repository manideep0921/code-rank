import express from "express";
import pool from "../config/db.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "10", 10), 100);
  try {
    const { rows } = await pool.query(
      "SELECT id, username, level, xp FROM users ORDER BY xp DESC, level DESC LIMIT $1",
      [Number.isFinite(limit) ? limit : 10]
    );
    // If no users, return [] (not 404)
    return res.json(rows || []);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
