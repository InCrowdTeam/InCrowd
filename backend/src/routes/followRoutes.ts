import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus
} from '../controllers/followController';

const router = express.Router();

/**
 * POST /api/follow/:userId
 * Segue un utente specifico (privato o ente)
 * 
 * Path parameters:
 * - userId: string (obbligatorio) - ID dell'utente da seguire
 * 
 * Risposta: Conferma follow creato
 * Accesso: Solo utenti autenticati (privati ed enti)
 * 
 * NOTA: Utente da seguire deve esistere e non essere già seguito.
 * Il contatore followingCount è calcolato lato frontend tramite array.length
 */
router.post('/:userId', authMiddleware, followUser);

/**
 * DELETE /api/follow/:userId
 * Smette di seguire un utente specifico
 * 
 * Path parameters:
 * - userId: string (obbligatorio) - ID dell'utente da smettere di seguire
 * 
 * Risposta: Conferma follow rimosso
 * Accesso: Solo utenti autenticati
 * 
 * NOTA: Relazione di follow deve esistere.
 * Il contatore followingCount è calcolato lato frontend tramite array.length
 */
router.delete('/:userId', authMiddleware, unfollowUser);

/**
 * GET /api/follow/followers/:userId
 * Recupera la lista dei follower di un utente specifico
 * 
 * Path parameters:
 * - userId: string (obbligatorio) - ID dell'utente
 * 
 * Risposta: Lista followers con dati base utenti
 * Accesso: Pubblico (senza autenticazione)
 * 
 * NOTA: Ordinamento per data di follow (più recenti prima).
 * Il contatore followersCount è calcolato lato frontend tramite array.length
 */
router.get('/followers/:userId', getFollowers);

/**
 * GET /api/follow/following/:userId
 * Recupera la lista degli utenti seguiti da un utente specifico
 * 
 * Path parameters:
 * - userId: string (obbligatorio) - ID dell'utente
 * 
 * Risposta: Lista following con dati base utenti
 * Accesso: Pubblico (senza autenticazione)
 * 
 * NOTA: Ordinamento per data di follow (più recenti prima).
 * Il contatore followingCount è calcolato lato frontend tramite array.length
 */
router.get('/following/:userId', getFollowing);

/**
 * GET /api/follow/status/:userId
 * Verifica se l'utente corrente segue un utente specifico
 * 
 * Path parameters:
 * - userId: string (obbligatorio) - ID dell'utente da verificare
 * 
 * Risposta: Boolean che indica se l'utente è seguito
 * Accesso: Solo utenti autenticati
 * 
 * NOTA: Utilizzato per mostrare stato pulsante follow/unfollow.
 * I contatori followersCount e followingCount sono calcolati lato frontend tramite array.length
 */
router.get('/status/:userId', authMiddleware, getFollowStatus);

export default router;