import express from "express";
import { getAllUsers, createUser } from "../controllers/userController";
import multer from "multer";

const router = express.Router();

//CreateUser
// Configura Multer per caricare i file in memoria (memoria temporanea)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", getAllUsers);
router.post("/", upload.single("fotoProfilo"), createUser);

export default router;