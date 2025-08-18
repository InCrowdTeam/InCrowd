import Follow from '../models/Follow';

/**
 * Utility per calcolare dinamicamente i contatori di followers e following
 */
export class FollowCountService {
  /**
   * Conta il numero di followers di un utente/ente
   * @param userId - ID dell'utente o ente
   * @returns Numero di followers
   */
  static async getFollowersCount(userId: string): Promise<number> {
    try {
      return await Follow.countDocuments({ followingId: userId });
    } catch (error) {
      console.error('Errore nel calcolo followers:', error);
      return 0;
    }
  }

  /**
   * Conta il numero di utenti/enti seguiti da un utente/ente
   * @param userId - ID dell'utente o ente
   * @returns Numero di following
   */
  static async getFollowingCount(userId: string): Promise<number> {
    try {
      return await Follow.countDocuments({ followerId: userId });
    } catch (error) {
      console.error('Errore nel calcolo following:', error);
      return 0;
    }
  }

  /**
   * Ottiene entrambi i contatori per un utente/ente
   * @param userId - ID dell'utente o ente
   * @returns Oggetto con followersCount e followingCount
   */
  static async getBothCounts(userId: string): Promise<{ followersCount: number; followingCount: number }> {
    try {
      const [followersCount, followingCount] = await Promise.all([
        this.getFollowersCount(userId),
        this.getFollowingCount(userId)
      ]);

      return { followersCount, followingCount };
    } catch (error) {
      console.error('Errore nel calcolo contatori:', error);
      return { followersCount: 0, followingCount: 0 };
    }
  }

  /**
   * Verifica se un utente sta seguendo un altro utente/ente
   * @param followerId - ID di chi segue
   * @param followingId - ID di chi viene seguito
   * @returns true se sta seguendo, false altrimenti
   */
  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const follow = await Follow.findOne({ followerId, followingId });
      return !!follow;
    } catch (error) {
      console.error('Errore nella verifica follow:', error);
      return false;
    }
  }

  /**
   * Ottiene i contatori e lo stato di follow per un utente
   * @param userId - ID dell'utente target
   * @param currentUserId - ID dell'utente corrente (opzionale)
   * @returns Oggetto con contatori e stato follow
   */
  static async getFullFollowInfo(
    userId: string, 
    currentUserId?: string
  ): Promise<{
    followersCount: number;
    followingCount: number;
    isFollowedByCurrentUser?: boolean;
  }> {
    try {
      const counts = await this.getBothCounts(userId);
      
      let isFollowedByCurrentUser: boolean | undefined;
      if (currentUserId && currentUserId !== userId) {
        isFollowedByCurrentUser = await this.isFollowing(currentUserId, userId);
      }

      return {
        ...counts,
        isFollowedByCurrentUser
      };
    } catch (error) {
      console.error('Errore nel recupero info follow completo:', error);
      return {
        followersCount: 0,
        followingCount: 0,
        isFollowedByCurrentUser: undefined
      };
    }
  }
}
