import { Router } from "express";
import { getUserBadgesByQuery, getUserBadgesByParam } from "../controllers/userBadgesController.js";

const router = Router();

// /api/userBadges?user_id=123
router.get("/", getUserBadgesByQuery);

// /api/userBadges/:id
router.get("/:id", getUserBadgesByParam);

export default router;
