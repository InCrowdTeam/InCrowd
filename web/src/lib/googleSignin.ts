import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Google Identity Services (GIS) — porting della logica OAuth del frontend Vue
 * (LoginView.vue / ProfiloView.vue). Nessuna dipendenza npm: lo script
 * `https://accounts.google.com/gsi/client` viene caricato a runtime e il
 * pulsante è renderizzato da Google stesso via `google.accounts.id.renderButton`.
 *
 * Il `client_id` arriva da `VITE_GOOGLE_CLIENT_ID`. Se manca, le funzioni
 * diventano no-op (così la pagina resta usabile con email/password).
 */

const GSI_SRC = 'https://accounts.google.com/gsi/client'

interface GoogleCredentialResponse {
  credential: string
  select_by?: string
}

// `window.google` è iniettato globalmente dallo script GIS.
declare global {
  interface Window {
    google?: any
  }
}

let scriptPromise: Promise<void> | null = null

/** Carica (una sola volta) lo script GIS e risolve quando `google.accounts.id` è pronto. */
export function loadGoogleScript(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()
  if (window.google?.accounts?.id) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const done = () => {
      // GIS espone `google.accounts.id` poco dopo l'onload dello script.
      const wait = (n: number) => {
        if (window.google?.accounts?.id) return resolve()
        if (n <= 0) return resolve() // risolvi comunque: il chiamante fa il guard
        setTimeout(() => wait(n - 1), 100)
      }
      wait(20)
    }
    const existing = document.querySelector<HTMLScriptElement>('script[src*="accounts.google.com/gsi/client"]')
    if (existing) {
      if (window.google?.accounts?.id) return resolve()
      existing.addEventListener('load', done)
      existing.addEventListener('error', () => reject(new Error('Errore caricamento script Google')))
      return
    }
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.onload = done
    s.onerror = () => reject(new Error('Errore caricamento script Google'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

export function isGoogleConfigured(): boolean {
  return !!(import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)
}

export interface GoogleButtonOptions {
  /** Testo del pulsante GIS. */
  text?: 'signin_with' | 'signup_with' | 'continue_with'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  /** Larghezza in px (GIS supporta max ~400). */
  width?: number
}

/**
 * Hook: renderizza il pulsante Google dentro al `<div ref={ref}>` restituito e
 * invoca `onCredential(idToken)` quando l'utente completa il sign-in.
 * `onCredential` può cambiare ad ogni render senza ri-renderizzare il pulsante.
 */
export function useGoogleSignIn(
  onCredential: (idToken: string) => void,
  options: GoogleButtonOptions = {},
) {
  // Il contenitore è tracciato in stato: così il pulsante viene (ri)renderizzato
  // anche quando il div compare DOPO il mount (es. step 2 del wizard di registrazione).
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const cb = useRef(onCredential)
  useEffect(() => {
    cb.current = onCredential
  }, [onCredential])

  const { text = 'continue_with', theme = 'outline', size = 'large', width } = options

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID non configurato: pulsante Google non disponibile.')
      return
    }
    if (!node) return
    let cancelled = false
    loadGoogleScript()
      .then(() => {
        if (cancelled || !node) return
        const google = window.google
        if (!google?.accounts?.id) return
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp: GoogleCredentialResponse) => cb.current(resp.credential),
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
          itp_support: true,
        })
        node.innerHTML = ''
        google.accounts.id.renderButton(node, {
          theme,
          size,
          shape: 'pill',
          logo_alignment: 'left',
          text,
          ...(width ? { width } : {}),
        })
      })
      .catch((e) => console.error('Errore inizializzazione Google:', e))
    return () => {
      cancelled = true
    }
  }, [node, text, theme, size, width])

  /** Aggancia questo callback al `<div ref={setRef}>` dove montare il pulsante. */
  const setRef = useCallback((n: HTMLDivElement | null) => {
    setNode(n)
  }, [])

  return setRef
}
