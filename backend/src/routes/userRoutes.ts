import express from "express";
import { getAllUsers, createUser } from "../controllers/userController";
import multer from "multer";
import User from "../models/User"; // Modello utente
import { Request, Response } from "express";

const router = express.Router();

//GetAll


//CreateUser
// Configura Multer per caricare i file in memoria (memoria temporanea)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", getAllUsers);
router.post("/", upload.single("fotoProfilo"), createUser);

export default router;