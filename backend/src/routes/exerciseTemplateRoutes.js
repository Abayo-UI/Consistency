import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { getMyTemplate, upsertMyTemplate, deleteMyTemplate, createDefaultTemplate } from "../controllers/exerciseTemplateController.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", getMyTemplate);
router.post("/", upsertMyTemplate);
router.put("/", upsertMyTemplate);
router.delete("/", deleteMyTemplate);
router.post("/default", createDefaultTemplate);

export default router;
