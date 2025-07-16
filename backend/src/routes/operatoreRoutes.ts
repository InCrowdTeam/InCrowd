import express from "express";
import { createOperatore } from "../controllers/operatoreController";
import { adminOnly } from "../middleware/admin";

const router = express.Router();

router.post("/", adminOnly, createOperatore);

export default router;
