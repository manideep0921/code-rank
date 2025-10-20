import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

function xpFromDifficulty(d) {
  switch (String(d || "").toLowerCase()) {
    case "easy": return 20;
    case "medium": return 40;
    case "hard": return 80;
    default: return 30;
  }
}

// ==========================================
// GET /api/problems → list all problems
// ==========================================
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, slug, difficulty
         FROM public.problems
        ORDER BY id ASC`
    );

    const out = rows.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      difficulty: r.difficulty,
      xp: xpFromDifficulty(r.difficulty),
    }));

    res.json(out);
  } catch (err) {
    console.error("[problems] list error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================================
// GET /api/problems/:idOrSlug → detail by id or slug
// (works as an alias for /api/problemDetail/:idOrSlug)
// ==========================================
router.get("/:idOrSlug", async (req, res) => {
  const v = req.params.idOrSlug;
  const isNum = /^\d+$/.test(v);

  const q = isNum
    ? { text: "SELECT * FROM public.problems WHERE id = $1", values: [Number(v)] }
    : { text: "SELECT * FROM public.problems WHERE slug = $1", values: [v] };

  try {
    const { rows } = await pool.query(q);
    if (!rows.length) return res.status(404).json({ error: "Not found" });

    const row = rows[0];
    const xp = Number.isFinite(row.xp) ? row.xp : xpFromDifficulty(row.difficulty);

    res.json({ ...row, xp });
  } catch (e) {
    console.error("[problems/:idOrSlug] error:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;