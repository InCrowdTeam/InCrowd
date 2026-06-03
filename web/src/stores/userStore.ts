import { create } from 'zustand'

/**
 * Store utente — porting dello store Pinia (frontend/src/stores/userStore.ts).
 * Persistenza su localStorage identica all'originale (chiavi: user/token/userType).
 */

type UserType = 'admin' | 'operatore' | 'ente' | 'privato' | string

interface UserState {
  user: any | null
  token: string
  userType: UserType
  setUser: (userData: any) => void
  setToken: (token: string) => void
  setUserType: (userType: string) => void
  logout: () => void
}

function readUser(): any | null {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

export const useUserStore = create<UserState>((set) => ({
  user: readUser(),
  token: localStorage.getItem('token') || '',
  userType: localStorage.getItem('userType') || '',

  setUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    set({ user: userData })
  },
  setToken: (token) => {
    localStorage.setItem('token', token)
    set({ token })
  },
  setUserType: (userType) => {
    localStorage.setItem('userType', userType)
    set({ userType })
  },
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    set({ user: null, token: '', userType: '' })
  },
}))

/* ---- Selettori (equivalenti ai getter Pinia) ---- */
export const selectIsAdmin = (s: UserState) => s.userType === 'admin'
export const selectIsOperatore = (s: UserState) => s.userType === 'operatore'
export const selectIsEnte = (s: UserState) => s.userType === 'ente'
export const selectIsUser = (s: UserState) => s.userType === 'privato'
export const selectCanHype = (s: UserState) => !!s.user && s.userType !== 'operatore'

/** Helper non-reattivo per uso fuori dai componenti (es. nelle pagine). */
export const userStore = {
  get: () => useUserStore.getState(),
  isAdmin: () => selectIsAdmin(useUserStore.getState()),
  isOperatore: () => selectIsOperatore(useUserStore.getState()),
  isEnte: () => selectIsEnte(useUserStore.getState()),
  isUser: () => selectIsUser(useUserStore.getState()),
  canHype: () => selectCanHype(useUserStore.getState()),
}
