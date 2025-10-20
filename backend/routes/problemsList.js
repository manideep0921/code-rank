import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, title, slug, difficulty, prompt
      FROM problems
      ORDER BY id ASC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
