// backend/models/users.js
import pool from "../config/db.js";

export async function getById(id) {
  const { rows } = await pool.query(
    "SELECT id::text, username, email, xp, level FROM users WHERE id=$1",
    [id]
  );
  return rows[0] || null;
}

export async function getByEmail(email) {
  const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  return rows[0] || null;
}

export async function create({ username, email, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password, level, xp)
     VALUES ($1,$2,$3,1,0)
     RETURNING id::text, username, email, xp, level`,
    [username, email, passwordHash]
  );
  return rows[0];
}

export async function addXp(userId, incXp) {
  // level = 1 + floor(xp/100)
  const { rows } = await pool.query(
    `UPDATE users
       SET xp = xp + $1,
           level = 1 + FLOOR((xp + $1)/100.0)
     WHERE id = $2
     RETURNING id::text, username, email, xp, level`,
    [incXp, userId]
  );
  return rows[0] || null;
}
