import pool from "../config/db.js";

const shape = r => ({
  id: String(r.id),
  username: r.username,
  email: r.email ?? null,
  xp: Number(r.xp ?? 0),
  level: Number(r.level ?? 1),
  avatar_url: r.avatar_url ?? null,
  full_name: r.full_name ?? null,
  bio: r.bio ?? null,
  location: r.location ?? null,
  website: r.website ?? null,
});

export async function getMyProfile(req, res, next) {
  try {
    const uid = req.user.id;
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.email, u.xp, u.level,
              p.avatar_url, p.full_name, p.bio, p.location, p.website
         FROM public.users u
    LEFT JOIN public.user_profiles p ON p.user_id=u.id
        WHERE u.id=$1`, [uid]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(shape(rows[0]));
  } catch (e) { next(e); }
}

export async function getProfileById(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.xp, u.level,
              p.avatar_url, p.full_name, p.bio, p.location, p.website
         FROM public.users u
    LEFT JOIN public.user_profiles p ON p.user_id=u.id
        WHERE u.id=$1`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(shape(rows[0]));
  } catch (e) { next(e); }
}

export async function updateMyProfile(req, res, next) {
  try {
    const uid = req.user.id;
    const { avatarUrl, fullName, bio, location, website } = req.body || {};
    await pool.query(
      `INSERT INTO public.user_profiles (user_id, avatar_url, full_name, bio, location, website, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET avatar_url=EXCLUDED.avatar_url,
             full_name =EXCLUDED.full_name,
             bio       =EXCLUDED.bio,
             location  =EXCLUDED.location,
             website   =EXCLUDED.website,
             updated_at=NOW()`,
      [uid, avatarUrl || null, fullName || null, bio || null, location || null, website || null]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function getProfileStats(req, res, next) {
  try {
    const { id } = req.params;
    const { rows: totals } = await pool.query(
      `SELECT
          COUNT(*)::int AS total_submissions,
          SUM((status='accepted')::int)::int AS accepted,
          SUM((status='failed')::int)::int   AS failed,
          COUNT(DISTINCT CASE WHEN status='accepted' THEN problem_id END)::int AS problems_solved
       FROM public.submissions
       WHERE user_id=$1`, [id]
    );
    const { rows: xp } = await pool.query(
      `SELECT DATE(s.created_at) AS day, COALESCE(SUM(p.xp),0)::int AS xp_gained
         FROM public.submissions s
         JOIN public.problems p ON p.id=s.problem_id
        WHERE s.user_id=$1 AND s.status='accepted'
        GROUP BY 1 ORDER BY 1`, [id]
    );
    res.json({ totals: totals[0] || { total_submissions: 0, accepted: 0, failed: 0, problems_solved: 0 }, xp });
  } catch (e) { next(e); }
}
