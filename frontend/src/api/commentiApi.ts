import axios from 'axios';
import { useUserStore } from '@/stores/userStore';

export async function getUltimiCommenti() {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/proposte/commenti`
  );
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel recupero commenti');
  }

  const body = await res.json();
  return body.data.commenti;
}

// Alias per compatibilità - ora entrambe le funzioni fanno la stessa cosa
export const getAllCommenti = getUltimiCommenti;
