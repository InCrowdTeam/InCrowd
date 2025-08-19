import express from "express";
import { getAllUsers, createUser, getCurrentUser, updateProfile, getUserById, getUserAvatar, deleteAccount, searchUsers } from "../controllers/userController";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";
import multer from "multer";

const router = express.Router();

// Middleware per autenticazione opzionale
const optionalAuth = (req: any, res: any, next: any) => {
  const header = req.headers.authorization;
  if (header) {
    // Se c'è un token, proviamo ad autenticare
    authMiddleware(req, res, next);
  } else {
    // Se non c'è token, proseguiamo senza autenticazione
    next();
  }
};

// Configura Multer per caricare i file in memoria (memoria temporanea)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per immagini di profilo
    files: 1 // Solo un file alla volta
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo di file non supportato. Sono permessi solo JPEG, JPG, PNG, GIF e WebP.'));
    }
  }
});

// Middleware per gestire gli errori di multer
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Il file è troppo grande. Dimensione massima: 5MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'È possibile caricare solo un file alla volta'
      });
    }
  }
  if (err.message && err.message.includes('Tipo di file non supportato')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next(err);
};

// === ROUTE UNIFICATE PER USER (privati ed enti) === //

// Rotta per ottenere tutti gli utenti - SOLO operatori e admin
router.get("/", authMiddleware, requireRole('operatore', 'admin'), getAllUsers);

// Rotta per creare un nuovo utente (privato o ente) con foto del profilo
// Richiede user_type nel body: 'privato' | 'ente'
router.post("/", upload.single("fotoProfilo"), handleMulterError, createUser);

// Rotta per ricerca utenti (pubblica)
router.get('/search', searchUsers);

// Rotta per ottenere i dati dell'utente corrente (autenticato)
router.get("/me", authMiddleware, getCurrentUser);

// Rotta per aggiornare il profilo dell'utente corrente
router.patch("/profile", authMiddleware, upload.single("fotoProfilo"), handleMulterError, updateProfile);

// Rotta per eliminare l'account dell'utente corrente e tutti i suoi dati
router.delete("/account", authMiddleware, deleteAccount);

// Endpoint pubblico per ottenere solo l'avatar di un utente
router.get("/:id/avatar", getUserAvatar);

// Rotta per ottenere un utente specifico - con autenticazione opzionale per più dati
router.get("/:id", optionalAuth, getUserById);

export default router;