// backend/routes/submissions.js
import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

/* ---------- Prefer controller-based handler; fall back if unavailable ---------- */
let submitCode = null;
try {
  const mod = await import("../controllers/submissionController.js");
  submitCode = mod?.submitCode ?? null;
} catch {
  // No controller or failed to load — inline fallback will be used.
}

/* ---------- Inline create fallback (echoes stored fields; returns `id`) ---------- */
/**
 * POST /api/submissions
 * body: { user_id, problem_id, language, code?, status, output?, error? }
 * resp:  { id, user_id, problem_id, language, status, output, error, created_at }
 */
const createSubmissionInline = async (req, res) => {
  try {
    const { user_id, problem_id, language, code, status, output, error } = req.body || {};

    if (!user_id || !problem_id || !language || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `
      INSERT INTO public.submissions (user_id, problem_id, language, code, status, output, error)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, user_id, problem_id, language, status, output, error, created_at
    `;
    const params = [
      user_id,
      problem_id,
      language,
      code ?? null,
      status,
      output ?? null,
      error ?? null,
    ];

    const { rows } = await pool.query(sql, params);
    return res.status(201).json(rows[0]); // exact shape: { id, user_id, problem_id, language, status, output, error, created_at }
  } catch (e) {
    console.error("[submissions.create]", e);
    return res.status(500).json({ error: "Server error" });
  }
};

/* Use controller if available; otherwise inline fallback */
router.post("/", submitCode ?? createSubmissionInline);

/* ---------- GET recent submissions by user ---------- */
/**
 * GET /api/submissions/user/:id?limit=10
 */
router.get("/user/:id", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const limit = Math.max(1, Math.min(Number.parseInt(req.query.limit ?? "10", 10), 100));
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid user ID" });

    const q = `
      SELECT id, user_id, problem_id, language, status, output, error, created_at
      FROM public.submissions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const { rows } = await pool.query(q, [id, limit]);
    return res.json(rows);
  } catch (err) {
    console.error("[submissions.user]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* ---------- GET submissions by problem ---------- */
/**
 * GET /api/submissions/problem/:problemId
 */
router.get("/problem/:problemId", async (req, res) => {
  try {
    const pid = Number.parseInt(req.params.problemId, 10);
    if (Number.isNaN(pid)) return res.status(400).json({ error: "Invalid problem ID" });

    const q = `
      SELECT id, user_id, problem_id, language, status, output, error, created_at
      FROM public.submissions
      WHERE problem_id = $1
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(q, [pid]);
    return res.json(rows);
  } catch (err) {
    console.error("[submissions.problem]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
