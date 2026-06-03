import { useNavigate } from 'react-router-dom'
import { Button, Card, Icon } from '@/components/ui'

export interface PlaceholderProps {
  title: string
  note?: string
  icon?: string
  /** Mostra il bottone "Torna alla Home". */
  home?: boolean
}

/**
 * Pagina segnaposto per le schermate non ancora ridisegnate (Fasi 2-6).
 * Permette all'app di funzionare e navigare da subito.
 */
export default function Placeholder({ title, note = 'Questa schermata arriverà in una fase successiva del redesign.', icon = 'sparkle', home = true }: PlaceholderProps) {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(14px,4vw,28px)' }}>
      <Card pad="clamp(28px,5vw,48px)" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--brand-soft)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 18px',
            color: 'var(--brand-700)',
          }}
        >
          <Icon name={icon} size={32} />
        </div>
        <h1 style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>{title}</h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 15, maxWidth: 460, margin: '0 auto' }}>{note}</p>
        {home && (
          <div style={{ marginTop: 22, display: 'inline-flex' }}>
            <Button icon="home" onClick={() => navigate('/')}>
              Torna alla Home
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
