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

  return res.json();
}

// API Admin per operatori
export async function getAllOperatori(token: string) {
  const res = await fetch(`${BASE_URL}/admin/operatori`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel recupero operatori');
  }

  return res.json();
}

export async function createOperatoreAdmin(operatoreData: any, token: string) {
  const res = await fetch(`${BASE_URL}/admin/operatori`, {
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

  return res.json();
}

export async function deleteOperatore(operatoreId: string, token: string) {
  const res = await fetch(`${BASE_URL}/admin/operatori/${operatoreId}`, {
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

  return res.json();
}
