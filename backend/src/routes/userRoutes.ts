import express from "express";
import { getAllUsers, createUser, getUtente, getCurrentUser, updateProfile, updatePassword } from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";
import multer from "multer";

const router = express.Router();

//CreateUser
// Configura Multer per caricare i file in memoria (memoria temporanea)
const storage = multer.memoryStorage();
const upload = multer({ storage });

//Rotta per ottenere tutti gli utenti
router.get("/", getAllUsers);

// Rotta per creare un nuovo utente con foto del profilo
router.post("/", upload.single("fotoProfilo"), createUser);

// Rotta per ottenere i dati dell'utente corrente (autenticato)
router.get("/me", authMiddleware, getCurrentUser);

// Rotta per aggiornare il profilo dell'utente corrente
router.patch("/profile", authMiddleware, upload.single("fotoProfilo"), updateProfile);

// Rotta per aggiornare la password dell'utente corrente
router.patch("/password", authMiddleware, updatePassword);

// Rotta per ottenere un utente specifico
router.get("/:id", getUtente as any);


export default router;