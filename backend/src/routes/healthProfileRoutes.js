import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  createOrUpdateHealthProfile,
  getMyHealthProfile,
  getHealthProfileById,
  updateHealthProfile,
  deleteHealthProfile,
} from "../controllers/healthProfileController.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", createOrUpdateHealthProfile);
router.get("/me", getMyHealthProfile);
router.get("/:id", getHealthProfileById);
router.put("/:id", updateHealthProfile);
router.delete("/:id", deleteHealthProfile);

export default router;
