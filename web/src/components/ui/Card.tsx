import type { CSSProperties, ReactNode } from 'react'

export interface CardProps {
  children?: ReactNode
  pad?: string
  style?: CSSProperties
  onClick?: () => void
  hover?: boolean
  className?: string
}

export function Card({ children, pad = 'var(--s-5)', style = {}, onClick, hover = false, className = '' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`ic-card ${hover ? 'ic-card-hover' : ''} ${className}`.trim()}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: pad,
        boxShadow: 'var(--shadow-sm)',
        transition: 'all .22s var(--ease)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
