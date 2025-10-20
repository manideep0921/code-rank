import pool from "../config/db.js";

export async function listNotes(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id::text, content, created_at
         FROM public.user_notes
        WHERE user_id=$1
        ORDER BY created_at DESC`, [req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
}

export async function addNote(req, res, next) {
  try {
    const { content } = req.body || {};
    if (!content?.trim()) return res.status(400).json({ error: "content required" });
    const { rows } = await pool.query(
      `INSERT INTO public.user_notes (user_id, content)
       VALUES ($1,$2)
       RETURNING id::text, content, created_at`, [req.user.id, content.trim()]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
}

export async function deleteNote(req, res, next) {
  try {
    const { noteId } = req.params;
    await pool.query(`DELETE FROM public.user_notes WHERE id=$1 AND user_id=$2`, [noteId, req.user.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
}
