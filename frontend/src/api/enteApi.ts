const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/enti`

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

  const body = await res.json()
  return body.data ?? body
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

  const body = await res.json()
  return body.data ?? body
}

// Creazione ente con FormData (per file upload)
export async function createEnteWithFormData(formData: FormData) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Errore nella creazione ente')
  }

  const body = await res.json()
  return body.data ?? body
}

export async function updateEnteProfile(token: string, formData: FormData) {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Errore nell\'aggiornamento del profilo')
  }

  const body = await res.json()
  return body.data ?? body
}

export async function updateEntePassword(token: string, newPassword: string) {
  const res = await fetch(`${BASE_URL}/password`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ newPassword })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Errore nell\'aggiornamento della password')
  }

  const body = await res.json()
  return body.data ?? body
}
