import type { CSSProperties } from 'react'
import { ICON_PATHS } from './iconPaths'

export interface IconProps {
  name: string
  size?: number
  stroke?: number
  fill?: string
  className?: string
  style?: CSSProperties
}

/** Icona line coerente (path da iconPaths.ts). Sostituisce tutte le emoji. */
export function Icon({ name, size = 20, stroke = 1.75, fill = 'none', className = '', style = {} }: IconProps) {
  const d = ICON_PATHS[name]
  if (!d) return null
  const solid = fill !== 'none'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? fill : 'none'}
      stroke={solid ? 'none' : 'currentColor'}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, display: 'block', ...style }}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}
