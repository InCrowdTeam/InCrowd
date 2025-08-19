import express from "express";
import { createOperatore, getOperatorStats, getAllOperatori, deleteOperatore } from "../controllers/operatoreController";
import { adminOnly } from "../middleware/admin";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";

const router = express.Router();

// Route per operatori (solo per admin)
router.get("/", adminOnly, getAllOperatori); // Lista operatori
router.post("/", adminOnly, createOperatore); // Crea operatore
router.delete("/:id", adminOnly, deleteOperatore); // Elimina operatore

// Rotta per le statistiche dell'operatore (accessibile agli operatori)
router.get("/stats", authMiddleware, requireRole("operatore"), getOperatorStats);

export default router;
