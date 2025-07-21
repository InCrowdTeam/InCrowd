const BASE_URL = 'http://localhost:3000/api/operatori'

export async function createOperatore(data: any) {
  const res = await fetch(BASE_URL, {
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
