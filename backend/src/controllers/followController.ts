import { Request, Response } from 'express';
import Follow from '../models/Follow';
import User from '../models/User';
import Ente from '../models/Ente';
import { apiResponse } from '../utils/responseFormatter';
import { AppError } from '../utils/error';

/**
 * Trova un utente/ente per ID e determina il tipo
 * @param id - ID dell'utente/ente da cercare
 * @returns Oggetto con user/ente e tipo, o null se non trovato
 */
const findUserOrEnte = async (id: string): Promise<{ entity: any; type: 'user' | 'ente' } | null> => {
  // Prima cerca negli utenti
  let entity = await User.findById(id);
  if (entity) {
    return { entity, type: 'user' };
  }
  
  // Se non trovato negli utenti, cerca negli enti
  entity = await Ente.findById(id);
  if (entity) {
    return { entity, type: 'ente' };
  }
  
  return null;
};

/**
 * Aggiorna i contatori di followers/following per un utente o ente
 * @param id - ID dell'utente/ente
 * @param type - Tipo ('user' o 'ente')
 * @param field - Campo da aggiornare ('followers' o 'following')
 * @param increment - Valore da aggiungere (+1 o -1)
 */
const updateCounters = async (id: string, type: 'user' | 'ente', field: 'followers' | 'following', increment: number) => {
  if (type === 'user') {
    await User.findByIdAndUpdate(id, { $inc: { [field]: increment } });
  } else {
    await Ente.findByIdAndUpdate(id, { $inc: { [field]: increment } });
  }
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

    // Aggiorna i contatori
    await updateCounters(followerId, followerInfo.type, 'following', 1);
    await updateCounters(followingId, followingInfo.type, 'followers', 1);

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

    // Determina i tipi dal documento follow (se disponibili) o cerca nelle collections
    let followerType = (follow as any).followerType || 'user';
    let followingType = (follow as any).followingType || 'user';

    // Se i tipi non sono disponibili nel documento, determinali cercando nelle collections
    if (!(follow as any).followerType) {
      const followerInfo = await findUserOrEnte(followerId);
      followerType = followerInfo?.type || 'user';
    }
    
    if (!(follow as any).followingType) {
      const followingInfo = await findUserOrEnte(followingId);
      followingType = followingInfo?.type || 'user';
    }

    // Aggiorna i contatori
    await updateCounters(followerId, followerType, 'following', -1);
    await updateCounters(followingId, followingType, 'followers', -1);

    res.json(apiResponse({ message: 'Hai smesso di seguire l\'utente' }));
  } catch (error: any) {
    res.status(error.status || 500).json(apiResponse({ message: error.message, error }));
  }
};

/**
 * Recupera la lista dei followers di un utente o ente con paginazione
 * @param req - Richiesta HTTP con userId nel parametro e page/limit opzionali
 * @param res - Risposta HTTP con lista dei followers
 */
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const follows = await Follow.find({ followingId: userId })
      .skip((page - 1) * limit)
      .limit(limit)
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

    res.json(apiResponse({ data: followers, message: 'Followers recuperati' }));
  } catch (error: any) {
    res.status(500).json(apiResponse({ message: error.message, error }));
  }
};

/**
 * Recupera la lista degli utenti/enti seguiti da un utente o ente con paginazione
 * @param req - Richiesta HTTP con userId nel parametro e page/limit opzionali
 * @param res - Risposta HTTP con lista degli utenti seguiti
 */
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const follows = await Follow.find({ followerId: userId })
      .skip((page - 1) * limit)
      .limit(limit)
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

    res.json(apiResponse({ data: following, message: 'Following recuperati' }));
  } catch (error: any) {
    res.status(500).json(apiResponse({ message: error.message, error }));
  }
};

/**
 * Verifica lo stato di follow tra l'utente autenticato e un altro utente o ente
 * @param req - Richiesta HTTP autenticata con userId nel parametro
 * @param res - Risposta HTTP con stato del follow e contatori
 */
export const getFollowStatus = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).user?.userId;
    const followingId = req.params.userId;

    if (!followerId) {
      throw new AppError('Utente non autenticato', 401);
    }

    const isFollowing = await Follow.exists({ followerId, followingId });
    
    // Trova l'utente o ente per ottenere i contatori
    const userInfo = await findUserOrEnte(followingId);
    
    res.json(apiResponse({ 
      data: {
        isFollowing: !!isFollowing,
        followersCount: userInfo?.entity.followers || 0,
        followingCount: userInfo?.entity.following || 0
      }, 
      message: 'Status recuperato' 
    }));
  } catch (error: any) {
    res.status(500).json(apiResponse({ message: error.message, error }));
  }
};