// backend/routes/user.js
import express from "express";
import {
  getUserById,
  getUserOverview,
  patchUser,
} from "../controllers/userController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

/**
 * ROUTES SUMMARY
 * ---------------
 * GET  /api/user/overview  → authenticated user’s dashboard data
 * GET  /api/user/:id       → public profile lookup
 * PATCH /api/user/:id      → update profile fields (auth required)
 *
 * NOTE: Always declare static routes (like /overview) BEFORE dynamic (/:id)
 *       to avoid route collision.
 */

// Protected overview (e.g., XP, recent submissions, badges, etc.)
router.get("/overview", requireAuth, getUserOverview);

// Public fetch by ID
router.get("/:id", getUserById);

// Authenticated update (e.g., username, bio, avatar)
router.patch("/:id", requireAuth, patchUser);

export default router;
