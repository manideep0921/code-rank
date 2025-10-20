// backend/controllers/userController.js
import pool from "../config/db.js";

/**
 * GET /api/user/:id
 * Returns a public snapshot of the user by ID.
 */
export async function getUserById(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const q = `
      SELECT id, username, email, xp, level
      FROM public.users
      WHERE id = $1
    `;
    const { rows } = await pool.query(q, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(rows[0]);
  } catch (e) {
    console.error("[user.getUserById]", e);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * GET /api/user/overview  (protected)
 * Uses req.user.id to return lightweight profile + recent submissions.
 */
export async function getUserOverview(req, res) {
  try {
    const userId = Number.parseInt(req.user?.id, 10);
    if (!Number.isFinite(userId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [{ rows: uRows }, { rows: subRows }] = await Promise.all([
      pool.query(
        `SELECT id, username, xp, level
           FROM public.users
          WHERE id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT s.id,
                s.problem_id,
                s.language,
                s.status,
                s.created_at,
                p.title
           FROM public.submissions s
           LEFT JOIN public.problems p ON p.id = s.problem_id
          WHERE s.user_id = $1
          ORDER BY s.created_at DESC
          LIMIT 10`,
        [userId]
      ),
    ]);

    if (!uRows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      profile: uRows[0],
      recentSubmissions: subRows,
    });
  } catch (e) {
    console.error("[user.getUserOverview]", e);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * PATCH /api/user/:id  (protected)
 * Body: { avatarUrl?, fullName?, bio?, location?, website? }
 * Upserts into public.user_profiles with a simple profile shape.
 */
export async function patchUser(req, res) {
  try {
    const authId = Number.parseInt(req.user?.id, 10);
    const paramId = Number.parseInt(req.params.id, 10);

    if (!Number.isFinite(authId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!Number.isFinite(paramId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    if (authId !== paramId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { avatarUrl, fullName, bio, location, website } = req.body ?? {};

    await pool.query(
      `
      INSERT INTO public.user_profiles
        (user_id, avatar_url, full_name, bio, location, website)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (user_id) DO UPDATE
        SET avatar_url = EXCLUDED.avatar_url,
            full_name  = EXCLUDED.full_name,
            bio        = EXCLUDED.bio,
            location   = EXCLUDED.location,
            website    = EXCLUDED.website
      `,
      [
        paramId,
        avatarUrl || null,
        fullName || null,
        bio || null,
        location || null,
        website || null,
      ]
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error("[user.patchUser]", e);
    return res.status(500).json({ error: "Server error" });
  }
}

export default { getUserById, getUserOverview, patchUser };
