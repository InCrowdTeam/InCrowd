
import express from "express";
import { getAllProposte, addProposta, hyperProposta, aggiungiCommento, getCommentiProposta, getPendingProposte, updateStatoProposta, deleteProposta, searchProposte, getMyProposte, getPropostaById, deleteCommento, getUltimiCommenti, getUserProposte, getFollowedUsersProposte } from "../controllers/propostaController";
import multer from "multer";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * GET /api/proposte/commenti
 * Recupera tutti i commenti da tutte le proposte (solo operatori)
 * 
 * Risposta: Lista commenti globali con proposta e utente
 * Accesso: Solo operatori autenticati (NO admin)
 * 
 * NOTA: Gli admin non possono accedere a questo endpoint per moderare commenti.
 * Gli admin possono solo gestire gli account operatori.
 */
router.get("/commenti", authMiddleware, requireRole("operatore"), getUltimiCommenti);

// Configura Multer per caricare i file in memoria (memoria temporanea)
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

/**
 * GET /api/proposte
 * Recupera tutte le proposte approvate pubblicamente
 * 
 * Risposta: Lista proposte approvate ordinate per data creazione
 * Accesso: Pubblico (senza autenticazione)
 * 
 * NOTA: Solo proposte con stato "approvata" sono visibili
 */
router.get("/", getAllProposte);

/**
 * GET /api/proposte/my
 * Recupera tutte le proposte dell'utente autenticato
 * 
 * Risposta: Lista proposte utente con tutti gli stati
 * Accesso: Solo utenti autenticati (privati ed enti)
 * 
 * NOTA: Include proposte in tutti gli stati (bozza, pubblicata, in_corso, completata, respinta)
 */
router.get("/my", authMiddleware, getMyProposte as any);

/**
 * GET /api/proposte/followed
 * Recupera le proposte approvate degli utenti seguiti dall'utente corrente
 * 
 * Risposta: Lista proposte approvate di utenti seguiti
 * Accesso: Solo utenti autenticati
 * 
 * NOTA: Solo proposte approvate sono incluse
 */
router.get("/followed", authMiddleware, getFollowedUsersProposte as any);

/**
 * GET /api/proposte/search
 * Cerca proposte per testo, categoria, città o stato
 * 
 * Query parameters:
 * - q: string (opzionale) - Testo di ricerca libera
 * - categoria: string (opzionale) - Filtra per categoria specifica
 * - citta: string (opzionale) - Filtra per città
 * - stato: 'bozza' | 'pubblicata' | 'in_corso' | 'completata' | 'respinta' (opzionale)
 * - sortBy: 'createdAt' | 'listaHyper' | 'titolo' (opzionale, default 'createdAt')
 * - sortOrder: 'asc' | 'desc' (opzionale, default 'desc')
 * 
 * Risposta: Lista proposte trovate con filtri applicati
 * Accesso: Pubblico (senza autenticazione)
 * 
 * NOTA: Solo proposte approvate sono incluse nei risultati
 */
router.get("/search", searchProposte);

/**
 * GET /api/proposte/user/:userId
 * Recupera le proposte approvate di un utente specifico
 * 
 * Path parameters:
 * - userId: string (obbligatorio) - ID dell'utente (privato o ente)
 * 
 * Risposta: Lista proposte approvate dell'utente specificato
 * Accesso: Pubblico (senza autenticazione)
 * 
 * NOTA: Solo proposte approvate sono incluse
 */
router.get("/user/:userId", getUserProposte);

/**
 * GET /api/proposte/pending
 * Recupera le proposte in attesa di approvazione (solo operatori)
 * 
 * Risposta: Lista proposte con stato "bozza"
 * Accesso: Solo operatori autenticati (NO admin)
 * 
 * NOTA: Gli admin non possono accedere a questo endpoint per moderare proposte.
 * Gli admin possono solo gestire gli account operatori.
 */
router.get("/pending", authMiddleware, requireRole("operatore"), getPendingProposte as any);

/**
 * POST /api/proposte
 * Crea una nuova proposta con upload immagine opzionale
 * 
 * Body richiesto (multipart/form-data):
 * - titolo: string (obbligatorio)
 * - descrizione: string (obbligatorio)
 * - categoria: string (opzionale)
 * - luogo: object (opzionale) - { via, citta, cap, provincia }
 * - dataIpotetica: string (opzionale) - Data ISO per realizzazione
 * - foto: file (opzionale, max 5MB, JPEG/PNG/GIF/WebP)
 * 
 * Risposta: Proposta creata con stato "bozza"
 * Accesso: Solo utenti autenticati (privati ed enti)
 * 
 * NOTA: Le proposte create hanno stato iniziale "bozza" e richiedono approvazione operatore
 */
router.post("/", authMiddleware, requireRole("privato", "ente"), upload.single("foto"), addProposta);

/**
 * GET /api/proposte/:id
 * Recupera i dettagli completi di una proposta specifica
 * 
 * Path parameters:
 * - id: string (obbligatorio) - ID della proposta
 * 
 * Risposta: Dettagli completi della proposta con proponente e commenti
 * Accesso: Pubblico (senza autenticazione)
 * 
 * NOTA: Solo proposte approvate sono visibili pubblicamente
 */
router.get("/:id", getPropostaById);

/**
 * PATCH /api/proposte/:id/hyper
 * Aggiunge o rimuove l'utente corrente dalla lista hype della proposta
 * 
 * Path parameters:
 * - id: string (obbligatorio) - ID della proposta
 * 
 * Risposta: Lista hype aggiornata
 * Accesso: Solo utenti autenticati (privati ed enti)
 * 
 * NOTA: Se l'utente è già nella lista, viene rimosso; altrimenti viene aggiunto.
 * Il contatore hype è calcolato lato frontend tramite listaHyper.length
 */
router.patch("/:id/hyper", authMiddleware, requireRole("privato", "ente"), hyperProposta as any);

/**
 * POST /api/proposte/:id/commenti
 * Aggiunge un nuovo commento a una proposta
 * 
 * Path parameters:
 * - id: string (obbligatorio) - ID della proposta
 * 
 * Body richiesto:
 * - contenuto: string (obbligatorio) - Testo del commento
 * 
 * Risposta: Commento aggiunto con dati completi
 * Accesso: Solo utenti autenticati (privati ed enti)
 * 
 * NOTA: Solo proposte approvate possono ricevere commenti
 */
router.post("/:id/commenti", authMiddleware, requireRole("privato", "ente"), aggiungiCommento as any);

/**
 * PATCH /api/proposte/:id/stato
 * Aggiorna lo stato di una proposta (moderazione)
 * 
 * Path parameters:
 * - id: string (obbligatorio) - ID della proposta
 * 
 * Body richiesto:
 * - stato: 'bozza' | 'pubblicata' | 'in_corso' | 'completata' | 'respinta' (obbligatorio)
 * - commento: string (opzionale) - Commento per spiegare il cambio di stato
 * 
 * Risposta: Proposta aggiornata con nuovo stato
 * Accesso: Solo operatori e admin
 */
router.patch("/:id/stato", authMiddleware, requireRole("operatore"), updateStatoProposta as any);

/**
 * GET /api/proposte/:id/commenti
 * Recupera tutti i commenti di una proposta specifica
 * 
 * Path parameters:
 * - id: string (obbligatorio) - ID della proposta
 * 
 * Risposta: Lista commenti della proposta con utente e data
 * Accesso: Pubblico (senza autenticazione)
 * 
 * NOTA: Commenti ordinati per data (più recenti prima)
 */
router.get("/:id/commenti", getCommentiProposta as any);

/**
 * DELETE /api/proposte/:propostaId/commenti/:commentoId
 * Elimina un commento specifico da una proposta
 * 
 * Path parameters:
 * - propostaId: string (obbligatorio) - ID della proposta
 * - commentoId: string (obbligatorio) - ID del commento
 * 
 * Risposta: Conferma eliminazione commento
 * Accesso: Solo il creatore del commento o operatori/admin
 * 
 * NOTA: Solo il proprietario può eliminare i propri commenti
 */
router.delete("/:propostaId/commenti/:commentoId", authMiddleware, deleteCommento as any);

/**
 * DELETE /api/proposte/:id
 * Elimina una proposta e tutti i suoi commenti
 * 
 * Path parameters:
 * - id: string (obbligatorio) - ID della proposta
 * 
 * Risposta: Conferma eliminazione proposta
 * Accesso: Solo il proponente, operatori o admin
 * 
 * NOTA: Solo il proprietario può eliminare le proprie proposte
 */
router.delete("/:id", authMiddleware, requireRole("privato", "ente", "operatore"), deleteProposta as any);

export default router;
