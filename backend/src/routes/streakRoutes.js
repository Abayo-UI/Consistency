import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  createStreak,
  getMyStreak,
  incrementStreak,
  resetStreak,
  getStreakById,
  updateStreak,
  deleteStreak,
} from "../controllers/streakController.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", createStreak);
router.get("/me", getMyStreak);
// increment/reset are internal operations derived from DailyLog; public endpoints removed to prevent client-side tampering.
router.get("/:id", getStreakById);
router.put("/:id", updateStreak);
router.delete("/:id", deleteStreak);

export default router;
