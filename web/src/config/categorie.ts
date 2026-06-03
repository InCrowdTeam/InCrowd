/**
 * Mappa delle categorie del dominio InCrowd.
 * Le chiavi coincidono con i valori `categoria` del backend.
 * Portato da incrowd-data.js del prototipo (label/color/soft/icon).
 */
export interface CategoriaInfo {
  label: string
  color: string
  soft: string
  icon: string
}

export const CATEGORIES: Record<string, CategoriaInfo> = {
  cultura: { label: 'Cultura', color: 'var(--cat-cultura)', soft: 'var(--cat-cultura-soft)', icon: 'masks' },
  concerti: { label: 'Concerti', color: 'var(--cat-concerti)', soft: 'var(--cat-concerti-soft)', icon: 'music' },
  mostreInstallazioni: { label: 'Mostre', color: 'var(--cat-mostre)', soft: 'var(--cat-mostre-soft)', icon: 'image' },
  sport: { label: 'Sport', color: 'var(--cat-sport)', soft: 'var(--cat-sport-soft)', icon: 'activity' },
  workshopCorsi: { label: 'Workshop e corsi', color: 'var(--cat-workshop)', soft: 'var(--cat-workshop-soft)', icon: 'tool' },
  conferenze: { label: 'Conferenze', color: 'var(--cat-conferenze)', soft: 'var(--cat-conferenze-soft)', icon: 'mic' },
}

export const CAT_ORDER = [
  'cultura',
  'concerti',
  'mostreInstallazioni',
  'sport',
  'workshopCorsi',
  'conferenze',
]

export function getCategoryLabel(categoria?: string): string {
  if (!categoria) return ''
  return CATEGORIES[categoria]?.label ?? categoria
}
