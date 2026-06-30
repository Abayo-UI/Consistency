import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  addWeightEntry,
  getWeightHistory,
  getWeightEntryById,
  updateWeightEntry,
  deleteWeightEntry,
} from "../controllers/weightHistoryController.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", addWeightEntry);
router.get("/", getWeightHistory);
router.get("/:id", getWeightEntryById);
router.put("/:id", updateWeightEntry);
router.delete("/:id", deleteWeightEntry);

export default router;
