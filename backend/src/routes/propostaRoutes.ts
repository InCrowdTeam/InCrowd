import express from "express";
import { getAllProposte, addProposta } from "../controllers/propostaController";
import multer from "multer";

const router = express.Router();

// Configura Multer per caricare i file in memoria (memoria temporanea)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Rotta per ottenere tutte le proposte
router.get("/", getAllProposte);

// Rotta per creare una nuova proposta (con upload file)
router.post("/", upload.single("foto"), addProposta);

export default router;