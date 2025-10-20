// backend/routes/auth.js
import express from "express";
import { signin, signup, me, forgot, reset, loginOrCreate } from "../controllers/authController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/_debug", (_req, res) => res.json({ ok: true, where: "/api/auth/_debug" }));

router.post("/signin", signin);
router.post("/signup", signup);
router.post("/login-or-create", loginOrCreate);
router.get("/me", requireAuth, me);
router.post("/forgot", forgot);
router.post("/reset", reset);

export default router;
