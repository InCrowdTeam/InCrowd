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