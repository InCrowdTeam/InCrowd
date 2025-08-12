const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/proposte`

export async function addProposta(userData: any) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Errore nella creazione proposta')
  }

  return res.json()
}

export interface SearchFilters {
  q?: string;
  categoria?: string;
  citta?: string;
  stato?: string;
  sortBy?: 'createdAt' | 'listaHyper' | 'titolo';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export async function searchProposte(filters: SearchFilters = {}) {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const res = await fetch(`${BASE_URL}/search?${params.toString()}`);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || error.message || 'Errore nella ricerca proposte');
  }

  const response = await res.json();
  return response.success ? response.data : response;
}

export async function getAllProposte() {
  const res = await fetch(BASE_URL);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || error.message || 'Errore nel recupero proposte');
  }

  const response = await res.json();
  return response.success ? response.data : response;
}

// Proposte in attesa di moderazione
export async function getPendingProposte(token: string) {
  const res = await fetch(`${BASE_URL}/pending`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel recupero proposte in attesa');
  }

  return res.json();
}

// Aggiungi/rimuovi da hyper lista
export async function toggleHyperProposta(propostaId: string, token: string) {
  const res = await fetch(`${BASE_URL}/${propostaId}/hyper`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nell\'aggiornamento hyper');
  }

  return res.json();
}

// Cambia stato proposta (moderazione)
export async function changePropostaState(propostaId: string, stato: string, token: string, commento?: string) {
  const res = await fetch(`${BASE_URL}/${propostaId}/stato`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stato, commento })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel cambio stato');
  }

  return res.json();
}

// Gestione commenti
export async function getCommenti(propostaId: string) {
  const res = await fetch(`${BASE_URL}/${propostaId}/commenti`);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel recupero commenti');
  }

  return res.json();
}

export async function addCommento(propostaId: string, testoCommento: string, token: string) {
  const res = await fetch(`${BASE_URL}/${propostaId}/commenti`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ contenuto: testoCommento })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nell\'aggiunta commento');
  }

  return res.json();
}

export async function deleteCommento(propostaId: string, commentoId: string, token: string) {
  const res = await fetch(`${BASE_URL}/${propostaId}/commenti/${commentoId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nell\'eliminazione commento');
  }

  return res.json();
}

export async function getPropostaById(id: string) {
  const res = await fetch(`${BASE_URL}/${id}`);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel recupero della proposta');
  }

  return res.json();
}