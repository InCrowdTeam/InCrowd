import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null') as any | null,
    token: localStorage.getItem('token') || '',
    userType: localStorage.getItem('userType') || '',
  }),
  getters: {
    isAdmin: (state) => state.userType === 'admin',
    isOperatore: (state) => state.userType === 'operatore',
    isEnte: (state) => state.userType === 'ente',
    isUser: (state) => state.userType === 'user',
    canHype: (state) => state.user && state.userType !== 'operatore',
  },
  actions: {
    setUser(userData: any) {
      this.user = userData;
      localStorage.setItem('user', JSON.stringify(userData));
    },
    setToken(token: string) {
      this.token = token;
      localStorage.setItem('token', token);
    },
    setUserType(userType: string) {
      this.userType = userType;
      localStorage.setItem('userType', userType);
    },
    logout() {
      this.user = null;
      this.token = '';
      this.userType = '';
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
    },
  },
});
