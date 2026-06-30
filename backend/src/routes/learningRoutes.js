import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  createLearning,
  getLearnings,
  getLearningById,
  updateLearning,
  deleteLearning,
} from "../controllers/learningController.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", createLearning);
router.get("/", getLearnings);
router.get("/:id", getLearningById);
router.put("/:id", updateLearning);
router.delete("/:id", deleteLearning);

export default router;
