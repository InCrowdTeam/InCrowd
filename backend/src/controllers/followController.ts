import { Request, Response } from "express";
import Follow from "../models/Follow";
import Privato from '../models/Privato'; // Rinominato da User
import Ente from "../models/Ente";
import { apiResponse } from "../utils/responseFormatter";
import { AppError } from '../utils/error';

/**
 * Trova un utente/ente per ID e determina il tipo
 * @param id - ID dell'utente/ente da cercare
 * @returns Oggetto con user/ente e tipo, o null se non trovato
 */
const findUserOrEnte = async (id: string): Promise<{ entity: any; type: 'privato' | 'ente' } | null> => {
  // Prima cerca nei privati
  let entity = await Privato.findById(id);
  if (entity) {
    return { entity, type: 'privato' };
  }
  
  // Se non trovato nei privati, cerca negli enti
  entity = await Ente.findById(id);
  if (entity) {
    return { entity, type: 'ente' };
  }
  
  return null;
};

/**
 * Permette ad un utente autenticato di seguire un altro utente o ente
 * @param req - Richiesta HTTP autenticata con userId nel parametro
 * @param res - Risposta HTTP con conferma del follow
 */
export const followUser = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).user?.userId;
    const followingId = req.params.userId;

    if (!followerId) {
      throw new AppError('Utente non autenticato', 401);
    }

    if (followerId === followingId) {
      throw new AppError('Non puoi seguire te stesso', 400);
    }

    // Verifica se il follower esiste e determina il tipo
    const followerInfo = await findUserOrEnte(followerId);
    if (!followerInfo) {
      throw new AppError('Follower non trovato', 404);
    }

    // Verifica se l'utente/ente da seguire esiste e determina il tipo
    const followingInfo = await findUserOrEnte(followingId);
    if (!followingInfo) {
      throw new AppError('Utente non trovato', 404);
    }

    // Verifica se già segue l'utente/ente
    const existingFollow = await Follow.findOne({ followerId, followingId });
    if (existingFollow) {
      throw new AppError('Stai già seguendo questo utente', 400);
    }

    // Crea il follow con informazioni sui tipi
    await Follow.create({ 
      followerId, 
      followingId,
      followerType: followerInfo.type,
      followingType: followingInfo.type
    });

    res.json(apiResponse({ message: 'Utente seguito con successo' }));
  } catch (error: any) {
    res.status(error.status || 500).json(apiResponse({ message: error.message, error }));
  }
};

/**
 * Permette ad un utente autenticato di smettere di seguire un altro utente o ente
 * @param req - Richiesta HTTP autenticata con userId nel parametro
 * @param res - Risposta HTTP con conferma dell'unfollow
 */
export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).user?.userId;
    const followingId = req.params.userId;

    if (!followerId) {
      throw new AppError('Utente non autenticato', 401);
    }

    const follow = await Follow.findOneAndDelete({ followerId, followingId });
    if (!follow) {
      throw new AppError('Non stai seguendo questo utente', 400);
    }

    res.json(apiResponse({ message: 'Hai smesso di seguire l\'utente' }));
  } catch (error: any) {
    res.status(error.status || 500).json(apiResponse({ message: error.message, error }));
  }
};

/**
 * Recupera la lista dei followers di un utente o ente
 * @param req - Richiesta HTTP con userId nel parametro
 * @param res - Risposta HTTP con lista dei followers
 */
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const follows = await Follow.find({ followingId: userId })
      .sort({ createdAt: -1 });

    // Popola manualmente i followers
    const followers = [];
    for (const follow of follows) {
      const followerInfo = await findUserOrEnte(follow.followerId.toString());
      if (followerInfo) {
        const followerData = {
          _id: followerInfo.entity._id,
          nome: followerInfo.entity.nome,
          cognome: followerInfo.entity.cognome,
          biografia: followerInfo.entity.biografia,
          fotoProfilo: followerInfo.entity.fotoProfilo,
          userType: followerInfo.type
        };
        followers.push(followerData);
      }
    }

    res.json(apiResponse({ data: { followers, total: followers.length }, message: 'Followers recuperati' }));
  } catch (error: any) {
    res.status(500).json(apiResponse({ message: error.message, error }));
  }
};

/**
 * Recupera la lista degli utenti/enti seguiti da un utente o ente
 * @param req - Richiesta HTTP con userId nel parametro
 * @param res - Risposta HTTP con lista degli utenti seguiti
 */
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const follows = await Follow.find({ followerId: userId })
      .sort({ createdAt: -1 });

    // Popola manualmente gli utenti/enti seguiti
    const following = [];
    for (const follow of follows) {
      const followingInfo = await findUserOrEnte(follow.followingId.toString());
      if (followingInfo) {
        const followingData = {
          _id: followingInfo.entity._id,
          nome: followingInfo.entity.nome,
          cognome: followingInfo.entity.cognome,
          biografia: followingInfo.entity.biografia,
          fotoProfilo: followingInfo.entity.fotoProfilo,
          userType: followingInfo.type
        };
        following.push(followingData);
      }
    }

    res.json(apiResponse({ data: { following, total: following.length }, message: 'Following recuperati' }));
  } catch (error: any) {
    res.status(500).json(apiResponse({ message: error.message, error }));
  }
};

/**
 * Verifica lo stato di follow tra l'utente autenticato e un altro utente o ente
 * @param req - Richiesta HTTP autenticata con userId nel parametro
 * @param res - Risposta HTTP con stato del follow
 */
export const getFollowStatus = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).user?.userId;
    const followingId = req.params.userId;

    if (!followerId) {
      throw new AppError('Utente non autenticato', 401);
    }

    // Verifica che l'utente/ente esista
    const userInfo = await findUserOrEnte(followingId);
    if (!userInfo) {
      throw new AppError('Utente non trovato', 404);
    }

    // Verifica se l'utente corrente segue l'utente target
    const isFollowing = await Follow.findOne({ followerId, followingId });
    
    res.json(apiResponse({ 
      data: {
        isFollowing: !!isFollowing
      }, 
      message: 'Status follow verificato' 
    }));
  } catch (error: any) {
    res.status(error.status || 500).json(apiResponse({ message: error.message, error }));
  }
};