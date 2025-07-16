import express from "express";
import { createEnte } from "../controllers/enteController";
import multer from "multer";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("fotoProfilo"), createEnte);

export default router;
