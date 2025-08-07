import { Router } from "express";
import { login, googleLogin, linkGoogleAccount } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/login", login);
router.post("/google", googleLogin);
router.post("/link-google", authMiddleware, linkGoogleAccount);

export default router;
