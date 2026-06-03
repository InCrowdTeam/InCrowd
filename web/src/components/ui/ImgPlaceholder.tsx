import type { CSSProperties } from 'react'
import { CATEGORIES } from '@/config/categorie'
import { Icon } from './Icon'

export interface ImgPlaceholderProps {
  cat?: string
  label?: string
  ratio?: string
  radius?: string
  style?: CSSProperties
}

/** Placeholder immagine tinto per categoria (onesto: dice "foto · categoria"). */
export function ImgPlaceholder({ cat, label, ratio = '16/10', radius = 'var(--r-md)', style = {} }: ImgPlaceholderProps) {
  const c = cat ? CATEGORIES[cat] : undefined
  const tint = c ? c.color : 'var(--brand)'
  const patternId = `stripe-${label || cat || 'x'}`
  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: ratio,
        borderRadius: radius,
        overflow: 'hidden',
        background: `linear-gradient(135deg, color-mix(in srgb, ${tint} 22%, var(--img-a)), var(--img-b))`,
        display: 'grid',
        placeItems: 'center',
        ...style,
      }}
    >
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} aria-hidden="true">
        <defs>
          <pattern id={patternId} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="22" height="22" fill="transparent" />
            <line x1="0" y1="0" x2="0" y2="22" stroke={tint} strokeWidth="1" opacity="0.18" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      {c && <Icon name={c.icon} size={34} stroke={1.6} style={{ color: tint, opacity: 0.6, position: 'relative' }} />}
      {label && (
        <span
          className="mono"
          style={{
            position: 'absolute',
            bottom: 9,
            left: 11,
            fontSize: 10.5,
            color: 'var(--ink-3)',
            background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
            padding: '2px 7px',
            borderRadius: 6,
            letterSpacing: '-.02em',
          }}
        >
          foto · {label}
        </span>
      )}
    </div>
  )
}
