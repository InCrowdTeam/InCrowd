import express from "express";
import { createEnte, getAllEnti, updateProfile, updatePassword } from "../controllers/enteController";
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

// Rotta per creare un nuovo ente
router.post("/", upload.single("fotoProfilo"), createEnte);

// Rotta per aggiornare il profilo dell'ente corrente
router.patch("/profile", authMiddleware, upload.single("fotoProfilo"), updateProfile);

// Rotta per aggiornare la password dell'ente corrente
router.patch("/password", authMiddleware, updatePassword);

export default router;
