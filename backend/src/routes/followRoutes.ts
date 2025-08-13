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

// Route per seguire un utente (richiede autenticazione)
router.post('/follow/:userId', authMiddleware, followUser);

// Route per smettere di seguire un utente (richiede autenticazione)
router.delete('/unfollow/:userId', authMiddleware, unfollowUser);

// Route per ottenere i followers di un utente (pubblica)
router.get('/followers/:userId', getFollowers);

// Route per ottenere gli utenti seguiti da un utente (pubblica)
router.get('/following/:userId', getFollowing);

// Route per controllare lo status di follow (richiede autenticazione)
router.get('/status/:userId', authMiddleware, getFollowStatus);

export default router;