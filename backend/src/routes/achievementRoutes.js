import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  createAchievement,
  getAchievements,
  getAchievementById,
  updateAchievement,
  deleteAchievement,
} from "../controllers/achievementController.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", createAchievement);
router.get("/", getAchievements);
router.get("/:id", getAchievementById);
router.put("/:id", updateAchievement);
router.delete("/:id", deleteAchievement);

export default router;
