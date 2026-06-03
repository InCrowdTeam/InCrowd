import { useSyncExternalStore } from 'react'

/**
 * Hook reattivo per una media query CSS. Sostituisce il prop `mobile` passato
 * a mano nel prototipo: i layout reagiscono al resize della finestra.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  )
}

/** True sotto la soglia indicata (default 760px, stessa del breakpoint navbar). */
export function useIsMobile(maxWidth = 760): boolean {
  return useMediaQuery(`(max-width: ${maxWidth}px)`)
}
