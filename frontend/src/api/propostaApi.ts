const BASE_URL = 'http://localhost:3000/api/proposte'

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
    throw new Error(error.message || 'Errore nella ricerca proposte');
  }

  return res.json();
}

export async function getAllProposte() {
  const res = await fetch(BASE_URL);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel recupero proposte');
  }

  return res.json();
}