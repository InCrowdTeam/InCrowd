import { useState, type MouseEvent } from 'react'
import { Icon } from './Icon'

export interface HypeProps {
  count: number
  active?: boolean
  onToggle?: () => void
  size?: 'sm' | 'md' | 'lg'
  /** Read-only: operatori e utenti non loggati non possono fare hype. */
  disabled?: boolean
}

/** Controllo Hype — fulmine pieno, bump del contatore, burst all'attivazione. */
export function Hype({ count, active = false, onToggle, size = 'md', disabled = false }: HypeProps) {
  const [burst, setBurst] = useState(0)
  const sizes = {
    sm: { pad: '5px 10px', fs: 13, ic: 14 },
    md: { pad: '7px 13px', fs: 14.5, ic: 17 },
    lg: { pad: '10px 16px', fs: 17, ic: 20 },
  }[size]

  const handle = (e: MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    if (!active) setBurst((b) => b + 1)
    onToggle?.()
  }

  return (
    <button
      onClick={handle}
      className="hype-btn"
      data-active={active}
      disabled={disabled}
      title={disabled ? 'Hype non disponibile' : active ? 'Togli hype' : 'Hype!'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: sizes.pad,
        borderRadius: 'var(--r-pill)',
        fontWeight: 700,
        fontSize: sizes.fs,
        position: 'relative',
        lineHeight: 1,
        border: active ? '1.5px solid transparent' : '1.5px solid var(--border)',
        background: active ? 'linear-gradient(135deg, var(--hype), var(--hype-deep))' : 'var(--surface)',
        color: active ? '#3a2600' : 'var(--ink-2)',
        boxShadow: active ? '0 4px 14px rgba(245,144,0,.35)' : 'var(--shadow-sm)',
        transition: 'all .2s var(--ease-back)',
      }}
    >
      <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
        <Icon
          name="bolt"
          size={sizes.ic}
          fill={active ? '#3a2600' : 'none'}
          stroke={active ? 0 : 1.9}
          style={{
            color: active ? '#3a2600' : 'var(--hype-deep)',
            transition: 'transform .25s var(--ease-back)',
            transform: active ? 'scale(1.08)' : 'none',
          }}
        />
        {burst > 0 && <span key={burst} className="hype-burst" />}
      </span>
      <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 8, textAlign: 'left' }}>{count}</span>
    </button>
  )
}
