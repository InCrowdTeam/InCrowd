import express from "express";
import { getAllUsers, createUser, getUtente, getCurrentUser, updateProfile, updatePassword, getUserById, getUserAvatar } from "../controllers/userController";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";
import multer from "multer";

const router = express.Router();

// Middleware per autenticazione opzionale
const optionalAuth = (req: any, res: any, next: any) => {
  const header = req.headers.authorization;
  if (header) {
    // Se c'è un token, proviamo ad autenticare
    authMiddleware(req, res, next);
  } else {
    // Se non c'è token, proseguiamo senza autenticazione
    next();
  }
};

//CreateUser
// Configura Multer per caricare i file in memoria (memoria temporanea)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Rotta per ottenere tutti gli utenti - SOLO operatori e admin
router.get("/", authMiddleware, requireRole('operatore', 'admin'), getAllUsers);

// Rotta per creare un nuovo utente con foto del profilo
router.post("/", upload.single("fotoProfilo"), createUser);

// Rotta per ottenere i dati dell'utente corrente (autenticato)
router.get("/me", authMiddleware, getCurrentUser);

// Rotta per aggiornare il profilo dell'utente corrente
router.patch("/profile", authMiddleware, upload.single("fotoProfilo"), updateProfile);

// Rotta per aggiornare la password dell'utente corrente
router.patch("/password", authMiddleware, updatePassword);

// Endpoint pubblico per ottenere solo l'avatar di un utente (DEVE essere prima di /:id)
router.get("/:id/avatar", getUserAvatar);

// Rotta per ottenere un utente specifico - con autenticazione opzionale per più dati
router.get("/:id", optionalAuth, getUserById);

// Manteniamo questo endpoint per compatibilità (deprecated)
router.get("/:id/legacy", getUtente as any);

export default router;