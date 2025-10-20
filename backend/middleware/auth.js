import jwt from "jsonwebtoken";

/**
 * Express middleware to check for a valid JWT in Authorization header.
 * Adds req.user = { id, email } if valid.
 */
export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");
    req.user = decoded;
    next();
  } catch (err) {
    console.error("[authMiddleware] JWT verify failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
