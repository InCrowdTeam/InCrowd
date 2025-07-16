const BASE_URL = 'http://localhost:3000/api/enti'

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
