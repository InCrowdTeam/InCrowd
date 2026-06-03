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

/** Badge ruolo: ente (cultura) vs utente privato (workshop). */
export function RoleBadge({ type }: { type?: string }) {
  if (type === 'ente')
    return (
      <Badge color="var(--cat-cultura)" bg="var(--cat-cultura-soft)" icon="building">
        Ente
      </Badge>
    )
  return (
    <Badge color="var(--cat-workshop)" bg="var(--cat-workshop-soft)" icon="user">
      Utente
    </Badge>
  )
}
