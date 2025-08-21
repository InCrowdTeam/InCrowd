import express from "express";
import { createOperatore, getOperatorStats, getAllOperatori, deleteOperatore } from "../controllers/operatoreController";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * GET /api/operatori
 * Recupera tutti gli operatori (solo per admin)
 * 
 * Risposta: Lista completa di tutti gli operatori
 * Accesso: Solo admin autenticati
 * 
 * NOTA: Gli admin possono solo gestire gli account operatori.
 * Non possono moderare proposte o vedere commenti globali.
 */
router.get("/", authMiddleware, requireRole("admin"), getAllOperatori);

/**
 * POST /api/operatori
 * Crea un nuovo operatore (solo per admin)
 * 
 * Body richiesto:
 * - nome: string (obbligatorio)
 * - email: string (obbligatorio, formato email valido)
 * - password: string (obbligatorio, deve rispettare requisiti di sicurezza)
 * 
 * Risposta: Operatore creato con dati completi
 * Accesso: Solo admin autenticati
 * 
 * NOTA: Gli operatori creati possono moderare proposte e vedere commenti globali
 */
router.post("/", authMiddleware, requireRole("admin"), createOperatore);

/**
 * DELETE /api/operatori/:id
 * Elimina un operatore (solo per admin)
 * 
 * Path parameters:
 * - id: string (obbligatorio) - ID dell'operatore da eliminare
 * 
 * Risposta: Conferma eliminazione operatore
 * Accesso: Solo admin autenticati
 * 
 * NOTA: Questa operazione è irreversibile e rimuove tutti i permessi dell'operatore
 */
router.delete("/:id", authMiddleware, requireRole("admin"), deleteOperatore);

/**
 * GET /api/operatori/stats
 * Recupera le statistiche dell'operatore autenticato
 * 
 * Risposta: Statistiche operative (proposte totali, attive, utenti totali)
 * Accesso: Solo operatori autenticati
 * 
 * NOTA: Gli admin non possono accedere a questo endpoint.
 * Solo gli operatori possono vedere le proprie statistiche.
 */
router.get("/stats", authMiddleware, requireRole("operatore"), getOperatorStats);

export default router;
