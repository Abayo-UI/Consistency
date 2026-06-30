import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  createGoogleFitEntry,
  getGoogleFitEntries,
  getGoogleFitEntryById,
  updateGoogleFitEntry,
  deleteGoogleFitEntry,
} from "../controllers/googleFitController.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", createGoogleFitEntry);
router.get("/", getGoogleFitEntries);
router.get("/:id", getGoogleFitEntryById);
router.put("/:id", updateGoogleFitEntry);
router.delete("/:id", deleteGoogleFitEntry);

export default router;
