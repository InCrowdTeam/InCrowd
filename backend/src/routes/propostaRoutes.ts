import express from "express";
import { getAllProposte, addProposta } from "../controllers/propostaController";
import multer from "multer";
import { Request, Response, NextFunction } from "express";


const router = express.Router();

// Configura Multer per caricare i file in memoria (memoria temporanea)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Rotta per ottenere tutte le proposte
router.get("/", getAllProposte);

router.get("/test", (req, res) => {
  console.log("Arrivata richiesta GET /proposte/test");
  res.json({ ok: true });
});

// Rotta per creare una nuova proposta (con upload file)
router.post("/", (req, res, next) => {
  console.log("Arrivata richiesta POST /proposte");
  next();
}, upload.single("foto"),
(req, res, next) => { console.log("2. Dopo Multer"); next(); },
addProposta);

router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Errore middleware Multer o altro:", err);
  res.status(500).json({ message: "Errore middleware Multer o altro", error: err });
});

export default router;