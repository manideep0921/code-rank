// backend/models/submissions.js
import pool from "../config/db.js";

export async function listByUser(userId, limit = 10) {
  const { rows } = await pool.query(
    `SELECT s.id::text, s.problem_id::text, p.title, s.language, s.status, s.output, s.error, s.created_at
       FROM submissions s
       JOIN problems p ON p.id = s.problem_id
      WHERE s.user_id=$1
      ORDER BY s.created_at DESC
      LIMIT $2`,
    [userId, Math.min(limit, 100)]
  );
  return rows;
}

export async function create({ user_id, problem_id, language, code, status, output, error }) {
  const { rows } = await pool.query(
    `INSERT INTO submissions (user_id, problem_id, language, code, status, output, error)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id::text, user_id::text, problem_id::text, language, status, output, error, created_at`,
    [user_id, problem_id, language, code || null, status, output || null, error || null]
  );
  return rows[0];
}

export async function hasAnySuccess(userId, problemId, excludeId) {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM submissions
      WHERE user_id=$1 AND problem_id=$2 AND status='success' AND id <> $3
      LIMIT 1`,
    [userId, problemId, excludeId]
  );
  return rowCount > 0;
}
