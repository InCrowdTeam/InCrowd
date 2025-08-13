import { Request, Response } from 'express';
import Follow from '../models/Follow';
import User from '../models/User';
import { apiResponse } from '../utils/responseFormatter';
import { AppError } from '../utils/error';

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

    // Verifica se l'utente da seguire esiste
    const userToFollow = await User.findById(followingId);
    if (!userToFollow) {
      throw new AppError('Utente non trovato', 404);
    }

    // Verifica se già segue l'utente
    const existingFollow = await Follow.findOne({ followerId, followingId });
    if (existingFollow) {
      throw new AppError('Stai già seguendo questo utente', 400);
    }

    // Crea il follow
    await Follow.create({ followerId, followingId });

    // Aggiorna i contatori
    await User.findByIdAndUpdate(followerId, { $inc: { following: 1 } });
    await User.findByIdAndUpdate(followingId, { $inc: { followers: 1 } });

    res.json(apiResponse({ message: 'Utente seguito con successo' }));
  } catch (error: any) {
    res.status(error.status || 500).json(apiResponse({ message: error.message, error }));
  }
};

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

    // Aggiorna i contatori
    await User.findByIdAndUpdate(followerId, { $inc: { following: -1 } });
    await User.findByIdAndUpdate(followingId, { $inc: { followers: -1 } });

    res.json(apiResponse({ message: 'Hai smesso di seguire l\'utente' }));
  } catch (error: any) {
    res.status(error.status || 500).json(apiResponse({ message: error.message, error }));
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const follows = await Follow.find({ followingId: userId })
      .populate('followerId', 'nome cognome fotoProfilo')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const followers = follows.map(follow => follow.followerId);

    res.json(apiResponse({ data: followers, message: 'Followers recuperati' }));
  } catch (error: any) {
    res.status(500).json(apiResponse({ message: error.message, error }));
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const follows = await Follow.find({ followerId: userId })
      .populate('followingId', 'nome cognome fotoProfilo')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const following = follows.map(follow => follow.followingId);

    res.json(apiResponse({ data: following, message: 'Following recuperati' }));
  } catch (error: any) {
    res.status(500).json(apiResponse({ message: error.message, error }));
  }
};

export const getFollowStatus = async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).user?.userId;
    const followingId = req.params.userId;

    if (!followerId) {
      throw new AppError('Utente non autenticato', 401);
    }

    const isFollowing = await Follow.exists({ followerId, followingId });
    const user = await User.findById(followingId, 'followers following');

    res.json(apiResponse({ 
      data: {
        isFollowing: !!isFollowing,
        followersCount: user?.followers || 0,
        followingCount: user?.following || 0
      }, 
      message: 'Status recuperato' 
    }));
  } catch (error: any) {
    res.status(500).json(apiResponse({ message: error.message, error }));
  }
};