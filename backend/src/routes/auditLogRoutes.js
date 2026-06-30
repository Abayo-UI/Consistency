import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { getAuditLogs, getAuditLogById } from "../controllers/auditLogController.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", getAuditLogs);
router.get("/:id", getAuditLogById);

export default router;
