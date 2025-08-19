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
    fileSize: 5 * 1024 * 1024 // 5MB per immagini di profilo
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

// === ROUTE UNIFICATE PER USER (privati ed enti) === //

// Rotta per ottenere tutti gli utenti - SOLO operatori e admin
router.get("/", authMiddleware, requireRole('operatore', 'admin'), getAllUsers);

// Rotta per creare un nuovo utente (privato o ente) con foto del profilo
// Richiede user_type nel body: 'privato' | 'ente'
router.post("/", upload.single("fotoProfilo"), createUser);

// Rotta per ricerca utenti (pubblica)
router.get('/search', searchUsers);

// Rotta per ottenere i dati dell'utente corrente (autenticato)
router.get("/me", authMiddleware, getCurrentUser);

// Rotta per aggiornare il profilo dell'utente corrente
router.patch("/profile", authMiddleware, upload.single("fotoProfilo"), updateProfile);

// Rotta per eliminare l'account dell'utente corrente e tutti i suoi dati
router.delete("/account", authMiddleware, deleteAccount);

// Endpoint pubblico per ottenere solo l'avatar di un utente
router.get("/:id/avatar", getUserAvatar);

// Rotta per ottenere un utente specifico - con autenticazione opzionale per più dati
router.get("/:id", optionalAuth, getUserById);

export default router;