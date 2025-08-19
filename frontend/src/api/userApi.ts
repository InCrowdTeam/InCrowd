import type { IUser } from '@/types/User';

// NUOVO ENDPOINT UNIFICATO per privati ed enti
const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/user`;

export interface UserResponse {
  data: {
    user: IUser;
  };
  message: string;
}

export interface UsersListResponse {
  data: {
    users: IUser[];
    total: number;
  };
  message: string;
}

export interface SearchUsersResponse {
  data: {
    users: IUser[];
    total: number;
    page: number;
    limit: number;
  };
  message: string;
}

export interface CreateUserData {
  user_type: 'privato' | 'ente';
  nome: string;
  cognome?: string; // Obbligatorio per privati
  nome_org?: string; // Obbligatorio per enti
  codiceFiscale: string;
  biografia?: string;
  email: string;
  password: string;
}

// Crea nuovo utente (privato o ente) - UNIFICATO
export async function createUser(userData: CreateUserData): Promise<UserResponse> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nella creazione utente');
  }

  return await res.json();
}

/**
 * Crea un nuovo utente (privato o ente) tramite FormData.
 * - Per signup classica: passare password (obbligatoria), non passare oauthCode.
 * - Per signup Google: passare oauthCode (obbligatorio), non passare password.
 * Il backend accetta uno solo dei due campi.
 */
export async function createUserWithFormData(formData: FormData): Promise<UserResponse> {
  // Validazione lato client: almeno uno tra password e oauthCode deve essere presente
  const hasPassword = formData.has('password') && formData.get('password');
  const hasOauthCode = formData.has('oauthCode') && formData.get('oauthCode');
  if (!hasPassword && !hasOauthCode) {
    throw new Error('Devi fornire una password oppure un oauthCode');
  }
  if (hasPassword && hasOauthCode) {
    throw new Error('Non puoi fornire sia password che oauthCode');
  }
  const res = await fetch(BASE_URL, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nella creazione utente');
  }

  return await res.json();
}

// Ottieni utente per ID (con token per dati completi, senza per dati pubblici)
export async function getUserById(id: string, token?: string): Promise<UserResponse> {
  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/${id}`, {
    headers
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel recupero utente');
  }

  return await res.json();
}

// Ottieni profilo utente corrente
export async function getCurrentUser(token: string): Promise<UserResponse> {
  const res = await fetch(`${BASE_URL}/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel recupero profilo');
  }

  return await res.json();
}

// Aggiorna profilo utente
export async function updateProfile(formData: FormData, token: string): Promise<UserResponse> {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nell\'aggiornamento profilo');
  }

  return await res.json();
}

// Ottieni solo l'avatar di un utente (endpoint pubblico)
export async function getUserAvatar(id: string): Promise<{ data: { fotoProfilo?: any }; message: string }> {
  const res = await fetch(`${BASE_URL}/${id}/avatar`);

  if (!res.ok) {
    // Se non trova l'avatar, restituisce errore 404
    const error = await res.json();
    throw new Error(error.message || 'Avatar non trovato');
  }

  return await res.json();
}

// Ottieni tutti gli utenti (solo per operatori/admin)
export async function getAllUsers(token: string): Promise<UsersListResponse> {
  const res = await fetch(BASE_URL, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel recupero utenti');
  }

  return await res.json();
}

// Elimina account utente - NUOVO ENDPOINT
export async function deleteAccount(token: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/account`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nell\'eliminazione dell\'account');
  }

  return await res.json();
}

// Cerca utenti - ENDPOINT UNIFICATO
export async function searchUsers(
  query: string, 
  page: number = 1, 
  limit: number = 10,
  user_type?: 'privato' | 'ente'
): Promise<SearchUsersResponse> {
  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.append('q', query);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());
  
  if (user_type) {
    url.searchParams.append('user_type', user_type);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Errore nella ricerca utenti');
  }

  return await response.json();
}