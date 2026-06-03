import { CATEGORIES } from '@/config/categorie'
import { Icon } from './Icon'

export interface CatTagProps {
  cat?: string
  solid?: boolean
  size?: 'sm' | 'md'
}

/** Tag categoria. In variante "Editoriale" si usa soft (solid=false). */
export function CatTag({ cat, solid = false, size = 'md' }: CatTagProps) {
  const c = cat ? CATEGORIES[cat] : undefined
  if (!c) return null
  const sm = size === 'sm'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: sm ? '4px 9px' : '6px 12px',
        borderRadius: 'var(--r-pill)',
        fontSize: sm ? 11.5 : 12.5,
        fontWeight: 700,
        lineHeight: 1,
        color: solid ? '#fff' : c.color,
        background: solid ? c.color : c.soft,
      }}
    >
      <Icon name={c.icon} size={sm ? 12 : 14} stroke={2.1} />
      {c.label}
    </span>
  )
}
