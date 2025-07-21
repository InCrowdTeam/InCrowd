const BASE_URL = 'http://localhost:3000/api/enti'

export async function getAllEnti(token: string) {
  const res = await fetch(BASE_URL, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    }
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Errore nel recupero enti')
  }

  return res.json()
}

export async function createEnte(data: any) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Errore nella creazione ente')
  }

  return res.json()
}
