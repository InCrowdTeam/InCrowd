import express from "express";
import { createOperatore, getOperatorStats, getAllOperatori, deleteOperatore } from "../controllers/operatoreController";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";

const router = express.Router();

// Route per operatori (solo per admin)
router.get("/", authMiddleware, requireRole("admin"), getAllOperatori); // Lista operatori
router.post("/", authMiddleware, requireRole("admin"), createOperatore); // Crea operatore
router.delete("/:id", authMiddleware, requireRole("admin"), deleteOperatore); // Elimina operatore

// Rotta per le statistiche dell'operatore (accessibile agli operatori)
router.get("/stats", authMiddleware, requireRole("operatore"), getOperatorStats);

export default router;
