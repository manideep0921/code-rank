// backend/middleware/requireAuth.js
import jwt from "jsonwebtoken";

/**
 * Strict auth: requires Bearer JWT and sets req.user = { id, email }.
 * Exported as DEFAULT so `import requireAuth from ".../requireAuth.js"` works.
 */
function requireAuth(req, res, next) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const secret = process.env.JWT_SECRET || "dev_super_secret_change_me";
    const payload = jwt.verify(token, secret);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export default requireAuth;
