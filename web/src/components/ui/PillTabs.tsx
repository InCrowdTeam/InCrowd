import { Icon } from './Icon'

export interface PillTab {
  id: string
  label: string
  icon?: string
}

export interface PillTabsProps {
  tabs: PillTab[]
  active: string
  onChange: (id: string) => void
  full?: boolean
}

export function PillTabs({ tabs, active, onChange, full = false }: PillTabsProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--surface-3)',
        borderRadius: 'var(--r-pill)',
        padding: 4,
        gap: 3,
        width: full ? '100%' : 'auto',
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: full ? 1 : 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            padding: '9px 18px',
            borderRadius: 'var(--r-pill)',
            fontSize: 14,
            fontWeight: 700,
            color: active === t.id ? '#fff' : 'var(--ink-2)',
            background: active === t.id ? 'var(--brand)' : 'transparent',
            boxShadow: active === t.id ? '0 3px 10px rgba(255,77,94,.3)' : 'none',
            transition: 'all .2s var(--ease)',
          }}
        >
          {t.icon && <Icon name={t.icon} size={16} />}
          {t.label}
        </button>
      ))}
    </div>
  )
}
