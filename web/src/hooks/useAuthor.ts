import { useEffect, useState } from 'react'
import type { IUser } from '@/types/User'
import { UserService } from '@/services/UserService'

/**
 * Risolve l'autore di una proposta a partire dal solo `proponenteID`.
 *
 * Le liste proposte (getAllProposte / searchProposte) restituiscono solo
 * `proponenteID` (ObjectId), senza nome/avatar — a differenza del dettaglio,
 * arricchito lato backend. Per mostrare Avatar+nome sulla card senza scatenare
 * N+1 richieste incontrollate, qui c'è una cache a livello di modulo: ogni
 * autore unico viene caricato una sola volta (anche concorrentemente).
 */
const cache = new Map<string, IUser | null>()
const inflight = new Map<string, Promise<IUser | null>>()

function fetchAuthor(id: string): Promise<IUser | null> {
  if (cache.has(id)) return Promise.resolve(cache.get(id)!)
  const existing = inflight.get(id)
  if (existing) return existing
  const p = UserService.loadUser(id)
    .then((u) => {
      cache.set(id, u)
      inflight.delete(id)
      return u
    })
    .catch(() => {
      cache.set(id, null)
      inflight.delete(id)
      return null
    })
  inflight.set(id, p)
  return p
}

export function useAuthor(proponenteID?: string): IUser | null {
  const [author, setAuthor] = useState<IUser | null>(() =>
    proponenteID ? cache.get(proponenteID) ?? null : null,
  )

  useEffect(() => {
    if (!proponenteID) return
    let cancelled = false
    // fetchAuthor risolve immediatamente (microtask) se già in cache: nessun
    // setState sincrono nel corpo dell'effetto.
    fetchAuthor(proponenteID).then((u) => {
      if (!cancelled) setAuthor(u)
    })
    return () => {
      cancelled = true
    }
  }, [proponenteID])

  return author
}

/** Pulisce la cache autori (es. al logout). */
export function clearAuthorCache() {
  cache.clear()
  inflight.clear()
}
