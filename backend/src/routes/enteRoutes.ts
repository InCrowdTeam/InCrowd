import express from "express";
import { createEnte, getAllEnti } from "../controllers/enteController";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";
import multer from "multer";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo di file non supportato. Sono permessi solo JPEG, PNG, GIF e WebP.'));
    }
  }
});

// Rotta per ottenere tutti gli enti (solo per operatori)
router.get("/", authMiddleware, requireRole("operatore"), getAllEnti);

router.post("/", upload.single("fotoProfilo"), createEnte);

export default router;
