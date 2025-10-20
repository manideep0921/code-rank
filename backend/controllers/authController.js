// backend/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

/* ---------- helpers ---------- */
function sanitizeUser(row) {
  if (!row) return null;
  const { password, password_hash, reset_token, reset_expires, ...safe } = row;
  return safe;
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: "7d" }
  );
}

function usernameFromEmail(email) {
  const base = String(email).split("@")[0].replace(/[^a-zA-Z0-9_.-]/g, "") || "user";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}_${suffix}`;
}

/* ================================
 *  POST /api/auth/signup
 *  Body: { username, email, password }
 *  Resp: { message, token, user }
 * ================================ */
export async function signup(req, res) {
  const { username, email, password } = req.body || {};
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const exists = await pool.query(
      "SELECT 1 FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );
    if (exists.rowCount) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const insertSql = `
      INSERT INTO users (username, email, password, level, xp)
      VALUES ($1,$2,$3,1,0)
      RETURNING *
    `;
    const r = await pool.query(insertSql, [username, email, hashed]);

    const user = sanitizeUser(r.rows[0]);
    const token = signToken(user);
    return res.status(201).json({ message: "Signup successful", token, user });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    console.error("[auth.signup]", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* ================================
 *  POST /api/auth/signin
 *  Body: { email, password }
 *  Resp: { message, token, user }
 *  Supports bcrypt or pgcrypto(crypt)
 * ================================ */
export async function signin(req, res) {
  const { email, password } = req.body || {};
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const rs = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    const row = rs.rows[0];
    if (!row) return res.status(404).json({ error: "Not found" });

    let ok = false;
    try { ok = await bcrypt.compare(password, row.password); } catch { ok = false; }

    if (!ok) {
      const chk = await pool.query(
        "SELECT 1 FROM users WHERE email = $1 AND password = crypt($2, password)",
        [email, password]
      );
      ok = chk.rowCount > 0;
    }

    if (!ok) return res.status(401).json({ error: "Invalid password" });

    const user = sanitizeUser(row);
    const token = signToken(user);
    return res.json({ message: "Login successful", token, user });
  } catch (err) {
    console.error("[auth.signin]", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* ================================
 *  POST /api/auth/login-or-create
 *  Body: { email, password, username? }
 *  If not found -> create with xp=100 bonus
 * ================================ */
export async function loginOrCreate(req, res) {
  const { email, password, username } = req.body || {};
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const rs = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    const existing = rs.rows[0];

    if (existing) {
      let ok = false;
      try { ok = await bcrypt.compare(password, existing.password); } catch { ok = false; }
      if (!ok) {
        const chk = await pool.query(
          "SELECT 1 FROM users WHERE email = $1 AND password = crypt($2, password)",
          [email, password]
        );
        ok = chk.rowCount > 0;
      }
      if (!ok) return res.status(401).json({ error: "Invalid password" });

      const user = sanitizeUser(existing);
      const token = signToken(user);
      return res.json({ message: "Login successful", token, user, awarded_xp: 0 });
    }

    const uname = username?.trim() || usernameFromEmail(email);
    const hashed = await bcrypt.hash(password, 10);

    let created;
    try {
      created = await pool.query(
        `INSERT INTO users (username, email, password, level, xp)
         VALUES ($1,$2,$3,1,100)
         RETURNING *`,
        [uname, email, hashed]
      );
    } catch (e) {
      if (e.code === "23505" && /username/i.test(String(e.detail || ""))) {
        const alt = usernameFromEmail(email);
        created = await pool.query(
          `INSERT INTO users (username, email, password, level, xp)
           VALUES ($1,$2,$3,1,100)
           RETURNING *`,
          [alt, email, hashed]
        );
      } else {
        return res.status(409).json({ error: "User already exists" });
      }
    }

    const user = sanitizeUser(created.rows[0]);
    const token = signToken(user);
    return res.status(201).json({ message: "Account created", token, user, awarded_xp: 100 });
  } catch (err) {
    console.error("[auth.loginOrCreate]", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* ================================
 *  GET /api/auth/me (protected)
 * ================================ */
export async function me(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { rows } = await pool.query(
      "SELECT id, username, email, xp, level FROM users WHERE id = $1",
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });

    return res.json(rows[0]);
  } catch (err) {
    console.error("[auth.me]", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* ================================
 *  POST /api/auth/forgot  (dev)
 * ================================ */
export async function forgot(req, res) {
  const { email } = req.body || {};
  try {
    if (!email) return res.status(400).json({ error: "Email required" });

    const r = await pool.query("SELECT id, email FROM users WHERE email = $1", [email]);
    const u = r.rows[0];

    if (!u) return res.json({ ok: true });

    const token = jwt.sign(
      { id: u.id, email: u.email, purpose: "password_reset" },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "15m" }
    );

    return res.json({ ok: true, token });
  } catch (err) {
    console.error("[auth.forgot]", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* ================================
 *  POST /api/auth/reset  (dev)
 * ================================ */
export async function reset(req, res) {
  const { token, new_password } = req.body || {};
  try {
    if (!token || !new_password) {
      return res.status(400).json({ error: "Missing token or new_password" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    if (payload.purpose !== "password_reset") {
      return res.status(400).json({ error: "Invalid token purpose" });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hash, payload.id]);

    return res.json({ ok: true });
  } catch (err) {
    console.error("[auth.reset]", err);
    return res.status(400).json({ error: err.message || "Invalid or expired token" });
  }
}

export default { signup, signin, loginOrCreate, me, forgot, reset };
