import express from "express";
import { createOperatore } from "../controllers/operatoreController";
import { adminMiddleware } from "../middleware/admin";

const router = express.Router();

router.post("/", adminMiddleware, createOperatore);

export default router;
