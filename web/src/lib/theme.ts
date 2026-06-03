import { useSyncExternalStore } from 'react'

export type ThemeMode = 'auto' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'incrowd-theme'

const mql =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

function readMode(): ThemeMode {
  const v = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  return v === 'light' || v === 'dark' || v === 'auto' ? v : 'auto'
}

let mode: ThemeMode = readMode()

function resolve(m: ThemeMode): ResolvedTheme {
  if (m === 'auto') return mql?.matches ? 'dark' : 'light'
  return m
}

function apply() {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = resolve(mode)
}

const listeners = new Set<() => void>()
function emit() {
  listeners.forEach((l) => l())
}

/** Applica il tema iniziale + registra il listener di sistema (chiamato in main.tsx). */
export function initTheme() {
  apply()
  mql?.addEventListener('change', () => {
    if (mode === 'auto') {
      apply()
      emit()
    }
  })
}

export function setThemeMode(m: ThemeMode) {
  mode = m
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, m)
  apply()
  emit()
}

export function getThemeMode(): ThemeMode {
  return mode
}

export function getResolvedTheme(): ResolvedTheme {
  return resolve(mode)
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Hook React: { mode, resolved, setMode, toggle }. */
export function useTheme() {
  const resolved = useSyncExternalStore(
    subscribe,
    () => resolve(mode),
    () => 'light' as ResolvedTheme,
  )
  const currentMode = useSyncExternalStore(
    subscribe,
    () => mode,
    () => 'auto' as ThemeMode,
  )
  return {
    mode: currentMode,
    resolved,
    setMode: setThemeMode,
    /** Toggle esplicito light<->dark (esce da auto fissando il tema opposto a quello corrente). */
    toggle: () => setThemeMode(resolved === 'dark' ? 'light' : 'dark'),
  }
}
