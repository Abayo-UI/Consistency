import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  createDailyLog,
  getDailyLogs,
  getDailyLogById,
  getDailyLogByDate,
  updateDailyLog,
  deleteDailyLog,
  updateDailyLogByDate,
  deleteDailyLogByDate,
} from "../controllers/dailyLogController.js";

const router = express.Router();

// protect all daily log routes
router.use(requireAuth);

router.post("/", createDailyLog);
router.get("/", getDailyLogs);
// date route must come before id route to avoid collision
router.get("/date/:date", getDailyLogByDate);
router.put("/date/:date", updateDailyLogByDate);
router.delete("/date/:date", deleteDailyLogByDate);
router.get("/:id", getDailyLogById);
router.put("/:id", updateDailyLog);
router.delete("/:id", deleteDailyLog);

export default router;
