import express from "express";
import { getAllUsers, createUser, getUtente } from "../controllers/userController";
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

// Rotta per ottenere un utente specifico
router.get("/:id", getUtente as any);


export default router;