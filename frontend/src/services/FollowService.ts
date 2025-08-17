import type { FollowStatus } from '@/types/Follow';
import type { IUser } from '@/types/User';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Funzione per ottenere gli headers di autenticazione
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const followApi = {
  // Seguire un utente
  followUser: async (userId: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/api/follow/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || error.message || 'Errore nel seguire l\'utente');
    }
  },

  // Smettere di seguire un utente
  unfollowUser: async (userId: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/api/follow/unfollow/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || error.message || 'Errore nell\'annullare il follow');
    }
  },

  // Ottenere i followers di un utente
  getFollowers: async (userId: string, page: number = 1, limit: number = 20): Promise<IUser[]> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const res = await fetch(`${API_BASE_URL}/api/follow/followers/${userId}?${params}`);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || error.message || 'Errore nel recupero dei followers');
    }

    const response = await res.json();
    return response.data;
  },

  // Ottenere gli utenti seguiti
  getFollowing: async (userId: string, page: number = 1, limit: number = 20): Promise<IUser[]> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const res = await fetch(`${API_BASE_URL}/api/follow/following/${userId}?${params}`);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || error.message || 'Errore nel recupero degli utenti seguiti');
    }

    const response = await res.json();
    return response.data;
  },

  // Verificare lo status di follow
  getFollowStatus: async (userId: string): Promise<FollowStatus> => {
    const res = await fetch(`${API_BASE_URL}/api/follow/status/${userId}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || error.message || 'Errore nel verificare lo stato del follow');
    }

    const response = await res.json();
    return response.data;
  }
};