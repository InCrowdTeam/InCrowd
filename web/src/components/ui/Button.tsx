import type { CSSProperties, ReactNode } from 'react'
import { Icon } from './Icon'

type Variant = 'primary' | 'dark' | 'ghost' | 'soft' | 'success' | 'danger'

export interface ButtonProps {
  children?: ReactNode
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  iconRight?: string
  full?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  style?: CSSProperties
  disabled?: boolean
}

const VARIANTS: Record<Variant, CSSProperties> = {
  primary: { background: 'var(--brand)', color: '#fff', border: '1px solid transparent', boxShadow: '0 4px 14px rgba(255,77,94,.32)' },
  dark: { background: 'var(--ink)', color: 'var(--ink-inv)', border: '1px solid transparent' },
  ghost: { background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--border)' },
  soft: { background: 'var(--brand-soft)', color: 'var(--brand-700)', border: '1px solid transparent' },
  success: { background: 'var(--cat-sport-soft)', color: 'var(--cat-sport)', border: '1px solid transparent' },
  danger: { background: 'var(--brand-soft)', color: 'var(--brand-700)', border: '1px solid transparent' },
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  onClick,
  type = 'button',
  style = {},
  disabled,
}: ButtonProps) {
  const sz = { sm: { p: '8px 14px', fs: 13.5 }, md: { p: '11px 18px', fs: 14.5 }, lg: { p: '14px 24px', fs: 16 } }[size]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="ic-btn"
      data-variant={variant}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: sz.p,
        fontSize: sz.fs,
        fontWeight: 700,
        borderRadius: 'var(--r-pill)',
        width: full ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .18s var(--ease)',
        ...VARIANTS[variant],
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 20 : 17} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 20 : 17} />}
    </button>
  )
}
