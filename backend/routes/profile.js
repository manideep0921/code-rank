import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { getMyProfile, updateMyProfile, getProfileById, getProfileStats } from "../controllers/profileController.js";

const router = express.Router();

router.get("/me", requireAuth, getMyProfile);
router.patch("/me", requireAuth, updateMyProfile);
router.get("/stats/:id", getProfileStats);
router.get("/:id", getProfileById);

export default router;
