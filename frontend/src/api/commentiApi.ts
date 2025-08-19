// Import non utilizzati rimossi per ottimizzazione

export async function getUltimiCommenti() {
  // Verifica se l'utente è autenticato
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token di autenticazione mancante');
  }

  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/proposte/commenti`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Non autorizzato - effettua nuovamente il login');
    } else if (res.status === 403) {
      throw new Error('Accesso negato - solo gli operatori possono vedere i commenti globali');
    }
    const error = await res.json();
    throw new Error(error.message || 'Errore nel recupero commenti');
  }

  const body = await res.json();
  return body.data.commenti;
}

// Alias per compatibilità - ora entrambe le funzioni fanno la stessa cosa
export const getAllCommenti = getUltimiCommenti;
