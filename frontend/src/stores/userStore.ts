import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null') as any | null,
    token: localStorage.getItem('token') || '',
  }),
  actions: {
    setUser(userData: any) {
      this.user = userData;
      localStorage.setItem('user', JSON.stringify(userData));
    },
    setToken(token: string) {
      this.token = token;
      localStorage.setItem('token', token);  // Salva il token nel localStorage
    },
    logout() {
      this.user = null;
      this.token = '';
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
});
