import { useNavigate } from 'react-router-dom'
import { Card, Button, Icon } from '@/components/ui'

export default function NotLogged() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        maxWidth: 520,
        margin: '0 auto',
        padding: 'clamp(28px,6vw,64px) clamp(14px,4vw,28px) 80px',
      }}
    >
      <Card className="fade-in" pad="clamp(30px,5vw,44px)" style={{ borderRadius: 'var(--r-lg)', textAlign: 'center' }}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 20px',
            background: 'var(--brand-soft)',
            color: 'var(--brand)',
          }}
        >
          <Icon name="user" size={34} stroke={2} />
        </div>

        <h2 style={{ fontSize: 'clamp(24px,5vw,30px)', fontWeight: 800, color: 'var(--ink)' }}>Devi accedere</h2>
        <p style={{ marginTop: 12, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5 }}>
          Accedi o registrati per scoprire, partecipare e creare eventi straordinari nella tua città.
        </p>

        <div
          style={{
            marginTop: 'var(--s-7)',
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button icon="arrowright" onClick={() => navigate('/login')}>
            Accedi
          </Button>
          <Button variant="dark" icon="plus" onClick={() => navigate('/addUser')}>
            Registrati
          </Button>
        </div>

        <div style={{ marginTop: 'var(--s-5)' }}>
          <Button variant="ghost" icon="home" onClick={() => navigate('/')}>
            Torna alla Home
          </Button>
        </div>
      </Card>
    </div>
  )
}
