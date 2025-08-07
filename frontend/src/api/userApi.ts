const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/users`

export async function createUser(userData: any) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Errore nella creazione utente')
  }

  return res.json()
}

// Creazione utente con FormData (per file upload)
export async function createUserWithFormData(formData: FormData) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Errore nella creazione utente')
  }

  return res.json()
}


