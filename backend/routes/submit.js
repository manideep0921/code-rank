// backend/routes/submit.js
import express from "express";

const router = express.Router();

/**
 * We prefer the richer judge path:
 *   controllers/judgeController.submit  → runs public+hidden tests, awards XP (first AC)
 * Fallbacks (in order) if that file isn't present:
 *   controllers/submitController.submit → judged route (your earlier variant)
 *   controllers/submissionController.submit → judged route (naming alt)
 *
 * Auth:
 * - If middleware/requireAuth.js exists, we’ll use it.
 * - If not, the route will still work without auth (use at your own risk).
 */

let submitHandler = null;

// Try judgeController first
try {
  const mod = await import("../controllers/judgeController.js");
  submitHandler = mod?.submit ?? null;
} catch { /* not available */ }

// Fallback: submitController.js (your earlier file name)
if (!submitHandler) {
  try {
    const mod = await import("../controllers/submitController.js");
    submitHandler = mod?.submit ?? null;
  } catch { /* not available */ }
}

// Fallback: submissionController.js (alternate name)
if (!submitHandler) {
  try {
    const mod = await import("../controllers/submissionController.js");
    submitHandler = mod?.submit ?? null;
  } catch { /* not available */ }
}

if (!submitHandler) {
  // Final safety: fail fast with a clear message if no controller was found.
  throw new Error(
    "[routes/submit] No submit handler found. Expected one of: " +
    "controllers/judgeController.submit, controllers/submitController.submit, controllers/submissionController.submit"
  );
}

// Optional auth: use if available
let requireAuth = (_req, _res, next) => next();
try {
  const mod = await import("../middleware/requireAuth.js");
  if (typeof mod?.default === "function") requireAuth = mod.default;
} catch {
  // Middleware not present — route will be public. Consider adding requireAuth.js.
}

/**
 * POST /api/submit
 * Body (controller-dependent, commonly):
 *   { user_id?, problem_id|problemId, language, code }
 * If using requireAuth, controllers should read req.user.id as user id.
 */
router.post("/", requireAuth, (req, res) => submitHandler(req, res));

export default router;
