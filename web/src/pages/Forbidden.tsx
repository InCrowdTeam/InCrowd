import { useNavigate } from 'react-router-dom'
import { Button, Card, Icon } from '@/components/ui'

/**
 * 403 — l'utente è autenticato ma non ha i permessi per la pagina.
 * Mostrata IN PLACE dalla Guard (niente redirect verso /login).
 */
export default function Forbidden() {
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
          <Icon name="shield" size={32} />
        </div>
        <h1 style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>
          Accesso negato
        </h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 15, maxWidth: 460, margin: '0 auto' }}>
          Non hai i permessi necessari per accedere a questa pagina.
        </p>
        <div style={{ marginTop: 22, display: 'inline-flex' }}>
          <Button icon="home" onClick={() => navigate('/')}>
            Torna alla Home
          </Button>
        </div>
      </Card>
    </div>
  )
}
