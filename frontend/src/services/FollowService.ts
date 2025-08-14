import axios from 'axios';
import type { FollowStatus } from '@/types/Follow';
import type { IUser } from '@/types/User';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Configurazione axios con token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const followApi = {
  // Seguire un utente
  followUser: async (userId: string): Promise<void> => {
    await axios.post(`${API_BASE_URL}/api/follow/${userId}`, {}, {
      headers: getAuthHeaders()
    });
  },

  // Smettere di seguire un utente
  unfollowUser: async (userId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/unfollow/${userId}`, {
      headers: getAuthHeaders()
    });
  },

  // Ottenere i followers di un utente
  getFollowers: async (userId: string, page: number = 1, limit: number = 20): Promise<IUser[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/followers/${userId}`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  // Ottenere gli utenti seguiti
  getFollowing: async (userId: string, page: number = 1, limit: number = 20): Promise<IUser[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/following/${userId}`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  // Verificare lo status di follow
  getFollowStatus: async (userId: string): Promise<FollowStatus> => {
    const response = await axios.get(`${API_BASE_URL}/api/status/${userId}`, {
      headers: getAuthHeaders()
    });
    return response.data.data;
  }
};