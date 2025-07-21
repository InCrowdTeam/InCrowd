import express from "express";
import { createEnte, getAllEnti } from "../controllers/enteController";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";
import multer from "multer";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Rotta per ottenere tutti gli enti (solo per operatori)
router.get("/", authMiddleware, requireRole("operatore"), getAllEnti);

router.post("/", upload.single("fotoProfilo"), createEnte);

export default router;
