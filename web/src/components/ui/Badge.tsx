import type { CSSProperties, ReactNode } from 'react'
import { Icon } from './Icon'

export interface BadgeProps {
  children?: ReactNode
  color?: string
  bg?: string
  icon?: string
  style?: CSSProperties
}

export function Badge({ children, color = 'var(--ink-2)', bg = 'var(--surface-3)', icon, style = {} }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 'var(--r-pill)',
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: '.03em',
        textTransform: 'uppercase',
        color,
        background: bg,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={12} stroke={2.2} />}
      {children}
    </span>
  )
}

/**
 * Badge ruolo. L'utente privato NON ha badge (ridondante): si mostra solo per
 * Ente, Operatore e Admin.
 */
export function RoleBadge({ type }: { type?: string }) {
  if (type === 'ente')
    return (
      <Badge color="var(--cat-cultura)" bg="var(--cat-cultura-soft)" icon="building">
        Ente
      </Badge>
    )
  if (type === 'operatore')
    return (
      <Badge color="var(--ink-2)" bg="var(--surface-3)" icon="tool">
        Operatore
      </Badge>
    )
  if (type === 'admin')
    return (
      <Badge color="var(--brand-700)" bg="var(--brand-soft)" icon="shield">
        Admin
      </Badge>
    )
  return null
}
