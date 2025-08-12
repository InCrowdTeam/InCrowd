import express from "express";
import { createOperatore, getOperatorStats } from "../controllers/operatoreController";
import { adminOnly } from "../middleware/admin";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", adminOnly, createOperatore);

// Rotta per le statistiche dell'operatore
router.get("/stats", authMiddleware, requireRole("operatore"), getOperatorStats);

export default router;
