const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export async function createOperatore(data: any) {
  const res = await fetch(`${BASE_URL}/operatori`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Errore nella creazione operatore')
  }

  return res.json()
}

// Statistiche operatore
export async function getOperatoreStats(token: string) {
  const res = await fetch(`${BASE_URL}/operatori/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel recupero statistiche operatore');
  }

  const body = await res.json();
  return body.data ?? body;
}


// API Operatori (admin)
export async function getAllOperatori(token: string) {
  const res = await fetch(`${BASE_URL}/operatori`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel recupero operatori');
  }

  const body = await res.json();
  return body.data ?? body;
}

export async function createOperatoreAdmin(operatoreData: any, token: string) {
  const res = await fetch(`${BASE_URL}/operatori`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(operatoreData)
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nella creazione operatore');
  }

  const body = await res.json();
  return body.data ?? body;
}

export async function deleteOperatore(operatoreId: string, token: string) {
  const res = await fetch(`${BASE_URL}/operatori/${operatoreId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nella rimozione operatore');
  }

  const body = await res.json();
  return body.data ?? body;
}
