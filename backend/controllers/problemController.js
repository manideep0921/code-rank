// controllers/problemController.js
import pool from "../config/db.js";

function xpFromDifficulty(d) {
  switch (String(d || "").toLowerCase()) {
    case "easy": return 20;
    case "medium": return 40;
    case "hard": return 80;
    default: return 30;
  }
}
const normalize = (row) => ({
  id: row.id,
  title: row.title,
  slug: row.slug ?? null,
  difficulty: row.difficulty ?? null,
  xp: row.xp ?? xpFromDifficulty(row.difficulty),
  level: row.level ?? null,
  language: row.language ?? null,
});

export async function listProblems(_req, res) {
  try {
    // Strategy A: detect available columns and select only those
    const { rows: cols } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='problems'
    `);
    const names = new Set(cols.map(c => c.column_name));
    const selectFields = ["id", "title"];             // mandatory
    if (names.has("slug")) selectFields.push("slug");
    if (names.has("difficulty")) selectFields.push("difficulty");
    if (names.has("xp")) selectFields.push("xp");
    if (names.has("level")) selectFields.push("level");
    if (names.has("language")) selectFields.push("language");

    const { rows } = await pool.query(
      `SELECT ${selectFields.join(", ")} FROM public.problems ORDER BY id ASC`
    );
    return res.json(rows.map(normalize));

  } catch (eA) {
    console.error("[problems] Strategy A failed:", eA.stack || eA.message);

    try {
      // Strategy B: minimal portable select (columns every seed had)
      const { rows } = await pool.query(
        `SELECT id, title, COALESCE(slug, '') AS slug,
                COALESCE(difficulty, '') AS difficulty
           FROM public.problems
          ORDER BY id ASC`
      );
      return res.json(rows.map(normalize));
    } catch (eB) {
      console.error("[problems] Strategy B failed:", eB.stack || eB.message);

      try {
        // Strategy C: last-resort empty list to avoid UI 500 (logs preserved)
        console.error("[problems] Strategy C: returning empty[] to keep UI alive");
        return res.json([]);
      } catch {
        /* no-op */
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

export default { listProblems };
