const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/users`

export async function createUser(userData: any) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || error.message || 'Errore nella creazione utente')
  }

  const body = await res.json()
  return body.data ?? body
}

// Creazione utente con FormData (per file upload)
export async function createUserWithFormData(formData: FormData) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || error.message || 'Errore nella creazione utente')
  }

  const body = await res.json()
  return body.data ?? body
}

// Ottieni utente per ID (con token per dati completi, senza per dati pubblici)
export async function getUserById(id: string, token?: string) {
  const headers: any = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}/${id}`, {
    headers
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || error.message || 'Errore nel recupero utente')
  }

  const response = await res.json()
  return response.data ?? response
}

// Ottieni solo l'avatar di un utente (endpoint pubblico)
export async function getUserAvatar(id: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/${id}/avatar`)

  if (!res.ok) {
    // Se non trova l'avatar, restituisce stringa vuota invece di errore
    if (res.status === 404) {
      return '';
    }
    const error = await res.json()
    throw new Error(error.error || error.message || 'Errore nel recupero avatar')
  }

  const response = await res.json()
  
  // Il backend restituisce { success: true, data: { userId, nome, avatarUrl } }
  if (response.data && response.data.avatarUrl) {
    return response.data.avatarUrl;
  }
  
  return '';
}

// Ottieni tutti gli utenti (solo per operatori/admin)
export async function getAllUsers(token: string) {
  const res = await fetch(BASE_URL, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || error.message || 'Errore nel recupero utenti')
  }

  const response = await res.json()
  return response.data ?? response
}

/**
 * Elimina l'account dell'utente corrente e tutti i suoi dati associati
 * Questa operazione è IRREVERSIBILE e cancella:
 * - L'account utente
 * - Tutte le proposte create dall'utente
 * - Tutti i commenti scritti dall'utente
 * 
 * @param token - Token di autenticazione dell'utente
 * @returns Messaggio di conferma eliminazione
 * @throws Error se l'eliminazione fallisce
 */
export async function deleteAccount(token: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/me`, {
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

  const body = await res.json();
  return body;
}


