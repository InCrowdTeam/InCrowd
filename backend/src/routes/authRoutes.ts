import { Router } from "express";
import { login, googleLogin, linkGoogleAccount, updatePassword } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

/**
 * POST /api/auth/login
 * Autentica un utente con email e password e restituisce JWT token
 * 
 * Body richiesto:
 * - email: string (obbligatorio)
 * - password: string (obbligatorio)
 * 
 * Risposta: JWT token + dati utente completi
 * Accesso: Pubblico (senza autenticazione)
 */
router.post("/login", login);

/**
 * POST /api/auth/google
 * Autentica un utente tramite Google OAuth e restituisce JWT token
 * 
 * Body richiesto:
 * - idToken: string (obbligatorio) - Token ID ottenuto da Google Sign-In
 * 
 * Risposta: JWT token + dati utente, oppure needsRegistration: true se utente nuovo
 * Accesso: Pubblico (senza autenticazione)
 */
router.post("/google", googleLogin);

/**
 * POST /api/auth/link-google
 * Collega un account Google esistente all'utente autenticato
 * 
 * Body richiesto:
 * - idToken: string (obbligatorio) - Token ID ottenuto da Google Sign-In
 * 
 * Risposta: Conferma collegamento account
 * Accesso: Solo utenti autenticati (privati ed enti)
 */
router.post("/link-google", authMiddleware, linkGoogleAccount);

/**
 * PATCH /api/auth/password
 * Imposta la password per utenti che non ne hanno una (es. signup Google)
 * 
 * Body richiesto:
 * - newPassword: string (obbligatorio) - Nuova password da impostare
 * 
 * Risposta: Conferma impostazione password
 * Accesso: Solo utenti autenticati (privati ed enti)
 * 
 * NOTA: Questo endpoint NON permette di cambiare password esistente.
 * È solo per impostare una password se l'utente non ne ha una.
 */
router.patch("/password", authMiddleware, updatePassword);

export default router;
