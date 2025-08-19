import { Router } from "express";
import { login, googleLogin, linkGoogleAccount, updatePassword } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/login", login);
router.post("/google", googleLogin);
router.post("/link-google", authMiddleware, linkGoogleAccount);
router.patch("/password", authMiddleware, updatePassword);

export default router;
