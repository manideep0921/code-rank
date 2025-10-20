import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

// GET /api/debug/db → shows current DB + user
router.get("/db", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        current_database() AS db,
        current_user AS user,
        inet_server_addr()::text AS host,
        inet_server_port() AS port
    `);
    res.json({ ok: true, ...rows[0], conn: process.env.DBURL || process.env.DATABASE_URL || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
