import express, {Request, Response} from "express";
import { getAllProposte, addProposta, hyperProposta, aggiungiCommento, getCommentiProposta } from "../controllers/propostaController";
import multer from "multer";


const router = express.Router();

// Configura Multer per caricare i file in memoria (memoria temporanea)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Rotta per ottenere tutte le proposte
router.get("/", getAllProposte);

// Rotta per creare una nuova proposta (con upload file)
router.post("/", upload.single("foto"), addProposta);

//Rotta per mettere hype a una proposta
router.patch("/:titolo/hyper", hyperProposta as any);

// Rotta per aggiungere un commento a una proposta
router.post("/:titolo/commenti", aggiungiCommento as any);

// Rotta per ottenere i commenti di una proposta
router.get("/:titolo/commenti", getCommentiProposta as any);


export default router;