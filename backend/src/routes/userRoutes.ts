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

/**
 * GET /api/user
 * Recupera tutti gli utenti con dati completi (solo per operatori)
 * 
 * Risposta: Lista completa di tutti gli utenti con email e codice fiscale
 * Accesso: Solo operatori autenticati (NO admin)
 * 
 * NOTA: Gli admin non possono accedere a questo endpoint per vedere i dati utente.
 * Gli admin possono solo gestire gli account operatori.
 */
router.get("/", authMiddleware, requireRole('operatore'), getAllUsers);

/**
 * POST /api/user
 * Crea un nuovo utente (privato o ente) con foto del profilo
 * 
 * Body richiesto (multipart/form-data):
 * - user_type: 'privato' | 'ente' (obbligatorio)
 * - nome: string (obbligatorio)
 * - cognome: string (obbligatorio per privati)
 * - nome_org: string (obbligatorio per enti)
 * - codiceFiscale: string (obbligatorio)
 * - email: string (obbligatorio)
 * - password: string (obbligatorio)
 * - biografia: string (opzionale)
 * - fotoProfilo: file (opzionale, max 5MB)
 * 
 * Risposta: Utente creato con dati pubblici
 * Accesso: Pubblico (senza autenticazione)
 */
router.post("/", upload.single("fotoProfilo"), handleMulterError, createUser);

/**
 * GET /api/user/search
 * Cerca utenti per nome, cognome, nome_org o biografia
 * 
 * Query parameters:
 * - q: string (obbligatorio, min 2 caratteri) - Testo di ricerca
 * - user_type: 'privato' | 'ente' (opzionale) - Filtra per tipo utente
 * - limit: number (opzionale, default 10, max 50) - Numero risultati per pagina
 * - page: number (opzionale, default 1) - Numero pagina
 * 
 * Risposta: Lista utenti trovati con dati pubblici
 * Accesso: Pubblico (senza autenticazione)
 * 
 * NOTA: Email e codice fiscale sono visibili solo agli operatori autenticati
 */
router.get('/search', searchUsers);

/**
 * GET /api/user/me
 * Recupera il profilo completo dell'utente autenticato
 * 
 * Risposta: Dati completi dell'utente con credenziali sicure
 * Accesso: Solo utenti autenticati (privati ed enti)
 */
router.get("/me", authMiddleware, getCurrentUser);

/**
 * PATCH /api/user/profile
 * Aggiorna il profilo dell'utente autenticato
 * 
 * Body richiesto (multipart/form-data):
 * - nome: string (opzionale)
 * - cognome: string (opzionale, solo per privati)
 * - nome_org: string (opzionale, solo per enti)
 * - biografia: string (opzionale)
 * - fotoProfilo: file (opzionale, max 5MB)
 * 
 * Risposta: Profilo aggiornato con dati completi
 * Accesso: Solo utenti autenticati (privati ed enti)
 */
router.patch("/profile", authMiddleware, upload.single("fotoProfilo"), handleMulterError, updateProfile);

/**
 * DELETE /api/user/account
 * Elimina l'account dell'utente autenticato e tutti i suoi dati
 * 
 * Risposta: Conferma eliminazione account
 * Accesso: Solo utenti autenticati (privati ed enti)
 * 
 * NOTA: Questa operazione è irreversibile e elimina tutte le proposte e commenti
 */
router.delete("/account", authMiddleware, deleteAccount);

/**
 * GET /api/user/:id/avatar
 * Recupera solo l'avatar di un utente specifico
 * 
 * Path parameters:
 * - id: string (obbligatorio) - ID dell'utente
 * 
 * Risposta: Immagine profilo in base64
 * Accesso: Pubblico (senza autenticazione)
 */
router.get("/:id/avatar", getUserAvatar);

/**
 * GET /api/user/:id
 * Recupera i dettagli di un utente specifico
 * 
 * Path parameters:
 * - id: string (obbligatorio) - ID dell'utente
 * 
 * Risposta: Dati utente con visibilità condizionale
 * Accesso: Pubblico con autenticazione opzionale
 * 
 * NOTA: 
 * - Email e codice fiscale sono visibili solo agli operatori autenticati
 * - Utenti non autenticati vedono solo dati pubblici
 * - Utenti autenticati vedono dati pubblici (no email/codice fiscale)
 */
router.get("/:id", optionalAuth, getUserById);

export default router;