
import express from "express";
import { getAllProposte, addProposta, hyperProposta, aggiungiCommento, getCommentiProposta, getPendingProposte, updateStatoProposta, deleteProposta, searchProposte, getMyProposte, getPropostaById, deleteCommento, getUltimiCommenti, getUserProposte, getFollowedUsersProposte } from "../controllers/propostaController";
import multer from "multer";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";

const router = express.Router();

// Rotta per ottenere gli ultimi commenti globali
router.get("/commenti", getUltimiCommenti);

// Configura Multer per caricare i file in memoria (memoria temporanea)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo di file non supportato. Sono permessi solo JPEG, PNG, GIF e WebP.'));
    }
  }
});

// Rotta per ottenere tutte le proposte approvate
router.get("/", getAllProposte);

// Rotta per ottenere le proposte dell'utente autenticato
router.get("/my", authMiddleware, getMyProposte as any);

// Rotta per ottenere le proposte degli utenti seguiti
router.get("/followed", authMiddleware, getFollowedUsersProposte as any);

// Rotta per la ricerca delle proposte
router.get("/search", searchProposte);

// Rotta per ottenere le proposte approvate di un utente specifico
router.get("/user/:userId", getUserProposte);

// Proposte in attesa di revisione
router.get("/pending", authMiddleware, requireRole("operatore"), getPendingProposte as any);

// Rotta per creare una nuova proposta (con upload file)
router.post("/", authMiddleware, requireRole("privato", "ente"), upload.single("foto"), addProposta);

// Rotta per ottenere una singola proposta per ID
router.get("/:id", getPropostaById);

//Rotta per mettere hype a una proposta
router.patch("/:id/hyper", authMiddleware, requireRole("privato", "ente"), hyperProposta as any);

// Rotta per aggiungere un commento a una proposta
router.post("/:id/commenti", authMiddleware, requireRole("privato", "ente", "operatore"), aggiungiCommento as any);

// Aggiorna stato proposta (approva o rifiuta)
router.patch("/:id/stato", authMiddleware, requireRole("operatore"), updateStatoProposta as any);

// Rotta per ottenere i commenti di una proposta
router.get("/:id/commenti", getCommentiProposta as any);

// Rotta per eliminare un commento (solo il creatore o operatori/admin)
router.delete("/:propostaId/commenti/:commentoId", authMiddleware, deleteCommento as any);

// Rotta per eliminare una proposta
router.delete("/:id", authMiddleware, requireRole("privato", "ente", "operatore"), deleteProposta as any);

export default router;
