import type { ReactNode } from 'react'

export interface SectionTitleProps {
  children?: ReactNode
  sub?: ReactNode
  action?: ReactNode
}

export function SectionTitle({ children, sub, action }: SectionTitleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 'var(--s-4)',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h2 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, color: 'var(--ink)' }}>{children}</h2>
        {sub && <p style={{ color: 'var(--ink-3)', fontSize: 14.5, marginTop: 5 }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}
