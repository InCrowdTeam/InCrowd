import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as any | null,  // User data or null
    token: localStorage.getItem('token') || '',  // JWT token from localStorage
  }),
  actions: {
    setUser(userData: any) {
      this.user = userData;
    },
    setToken(token: string) {
      this.token = token;
      localStorage.setItem('token', token);  // Salva il token nel localStorage
    },
    logout() {
      this.user = null;
      this.token = '';
      localStorage.removeItem('token');
    },
  },
});
