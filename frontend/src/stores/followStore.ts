import { defineStore } from 'pinia';
import { followApi } from '@/services/FollowService';
import type { IUser } from '@/types/User';
import type { FollowStatus } from '@/types/Follow';

interface FollowState {
  // Set degli ID utenti che stiamo seguendo
  followedUsers: Set<string>;
  // Cache degli status di follow per evitare chiamate ripetute
  followStatusCache: Map<string, FollowStatus>;
  // Loading state per operazioni async
  loading: boolean;
  // Errori
  error: string | null;
}

export const useFollowStore = defineStore('follow', {
  state: (): FollowState => ({
    followedUsers: new Set<string>(),
    followStatusCache: new Map<string, FollowStatus>(),
    loading: false,
    error: null,
  }),

  getters: {
    // Verifica se stiamo seguendo un utente
    isFollowing: (state) => (userId: string) => {
      return state.followedUsers.has(userId);
    },

    // Ottiene lo status di follow dalla cache
    getFollowStatus: (state) => (userId: string) => {
      return state.followStatusCache.get(userId);
    },

    // Controlla se c'è un loading in corso
    isLoading: (state) => state.loading
  },

  actions: {
    // Seguire un utente
    async followUser(userId: string) {
      try {
        this.loading = true;
        this.error = null;
        
        await followApi.followUser(userId);
        
        // Aggiorna lo stato locale immediatamente
        this.followedUsers.add(userId);
        
        // Aggiorna la cache del status se esiste
        const currentStatus = this.followStatusCache.get(userId);
        if (currentStatus) {
          this.followStatusCache.set(userId, {
            ...currentStatus,
            isFollowing: true,
            followersCount: currentStatus.followersCount + 1
          });
        }
        
        console.log(`✅ Utente ${userId} seguito con successo`);
        
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Errore durante il follow';
        console.error('❌ Errore follow:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Smettere di seguire un utente
    async unfollowUser(userId: string) {
      try {
        this.loading = true;
        this.error = null;
        
        await followApi.unfollowUser(userId);
        
        // Aggiorna lo stato locale immediatamente
        this.followedUsers.delete(userId);
        
        // Aggiorna la cache del status se esiste
        const currentStatus = this.followStatusCache.get(userId);
        if (currentStatus) {
          this.followStatusCache.set(userId, {
            ...currentStatus,
            isFollowing: false,
            followersCount: Math.max(0, currentStatus.followersCount - 1)
          });
        }
        
        console.log(`✅ Utente ${userId} unfollowato con successo`);
        
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Errore durante l\'unfollow';
        console.error('❌ Errore unfollow:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Caricare lo status di follow per un utente
    async loadFollowStatus(userId: string, forceRefresh = false): Promise<FollowStatus> {
      try {
        // Se è in cache e non forziamo il refresh, usa la cache
        if (!forceRefresh && this.followStatusCache.has(userId)) {
          return this.followStatusCache.get(userId)!;
        }

        const status = await followApi.getFollowStatus(userId);
        
        // Salva in cache
        this.followStatusCache.set(userId, status);
        
        // Aggiorna il set dei seguiti
        if (status.isFollowing) {
          this.followedUsers.add(userId);
        } else {
          this.followedUsers.delete(userId);
        }
        
        return status;
      } catch (error: any) {
        console.error('❌ Errore nel caricamento del follow status:', error);
        throw error;
      }
    },

    // Caricare i followers di un utente
    async loadFollowers(userId: string, page: number = 1, limit: number = 20): Promise<IUser[]> {
      try {
        this.loading = true;
        return await followApi.getFollowers(userId, page, limit);
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Errore nel caricamento dei followers';
        console.error('❌ Errore followers:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Caricare gli utenti seguiti
    async loadFollowing(userId: string, page: number = 1, limit: number = 20): Promise<IUser[]> {
      try {
        this.loading = true;
        return await followApi.getFollowing(userId, page, limit);
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Errore nel caricamento del following';
        console.error('❌ Errore following:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Toggle follow/unfollow (utility)
    async toggleFollow(userId: string) {
      if (this.isFollowing(userId)) {
        await this.unfollowUser(userId);
      } else {
        await this.followUser(userId);
      }
    },

    // Pulire gli errori
    clearError() {
      this.error = null;
    },

    // Pulire la cache (utile per logout)
    clearCache() {
      this.followedUsers.clear();
      this.followStatusCache.clear();
      this.error = null;
      this.loading = false;
    }
  }
});