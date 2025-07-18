import express from "express";
import { getAllProposte, addProposta, hyperProposta, aggiungiCommento, getCommentiProposta, getPendingProposte, updateStatoProposta } from "../controllers/propostaController";
import multer from "multer";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";



const router = express.Router();

// Configura Multer per caricare i file in memoria (memoria temporanea)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Rotta per ottenere tutte le proposte
router.get("/", getAllProposte);

// Proposte in attesa di revisione
router.get("/pending", authMiddleware, requireRole("operatore"), getPendingProposte as any);

// Rotta per creare una nuova proposta (con upload file)
router.post("/", authMiddleware, requireRole("user", "ente"), upload.single("foto"), addProposta);

//Rotta per mettere hype a una proposta
router.patch("/:titolo/hyper", authMiddleware, requireRole("user", "ente"), hyperProposta as any);

// Rotta per aggiungere un commento a una proposta
router.post("/:titolo/commenti", authMiddleware, requireRole("user", "ente", "operatore"), aggiungiCommento as any);

// Aggiorna stato proposta (approva o rifiuta)
router.patch("/:titolo/stato", authMiddleware, requireRole("operatore"), updateStatoProposta as any);

// Rotta per ottenere i commenti di una proposta
router.get("/:titolo/commenti", getCommentiProposta as any);


export default router;
