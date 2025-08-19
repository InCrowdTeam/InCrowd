// MAPPINGS LEGACY -> NUOVI ENDPOINTS
// Questo file serve per documentare il mapping tra le vecchie funzioni e quelle nuove

import { createUser, getUserById, getCurrentUser, getAllUsers, searchUsers, createUserWithFormData } from './userApi';

// ⚠️ DEPRECATO: usare userApi.ts invece
// Le funzioni di enteApi.ts sono ora unificate in userApi.ts

// MIGRAZIONE DEGLI ENDPOINT:
// OLD /api/enti -> NEW /api/user (con user_type: 'ente')
// OLD /api/users -> NEW /api/user (con user_type: 'privato')

// ESEMPI DI MIGRAZIONE:

// PRIMA (DEPRECATO):
// import { createEnte } from '@/api/enteApi'
// import { createUser } from '@/api/userApi'

// DOPO (NUOVO):
// import { createUser } from '@/api/userApi'
// 
// // Per privati:
// createUser({ user_type: 'privato', nome: 'Mario', cognome: 'Rossi', ... })
//
// // Per enti:
// createUser({ user_type: 'ente', nome_org: 'Comune di Roma', ... })

/**
 * @deprecated Usare userApi.createUser con user_type: 'ente'
 */
export const createEnte = (data: any) => {
  console.warn('createEnte è deprecato. Usare userApi.createUser con user_type: "ente"');
  return createUser({
    ...data,
    user_type: 'ente'
  });
};

/**
 * @deprecated Usare userApi.createUserWithFormData
 */
export const createEnteWithFormData = (formData: FormData) => {
  console.warn('createEnteWithFormData è deprecato. Usare userApi.createUserWithFormData');
  // Aggiungi user_type se non presente
  if (!formData.has('user_type')) {
    formData.append('user_type', 'ente');
  }
  return createUserWithFormData(formData);
};

/**
 * @deprecated Usare userApi.getAllUsers (filtra per user_type se necessario)
 */
export const getAllEnti = (token: string) => {
  console.warn('getAllEnti è deprecato. Usare userApi.getAllUsers e filtrare per user_type: "ente"');
  return getAllUsers(token);
};

/**
 * @deprecated Usare userApi.getUserById
 */
export const getEnteById = (id: string, token?: string) => {
  console.warn('getEnteById è deprecato. Usare userApi.getUserById');
  return getUserById(id, token);
};

/**
 * @deprecated Usare userApi.searchUsers con user_type: 'ente'
 */
export const searchEnti = (query: string, page: number = 1, limit: number = 10) => {
  console.warn('searchEnti è deprecato. Usare userApi.searchUsers con user_type: "ente"');
  return searchUsers(query, page, limit, 'ente');
};
