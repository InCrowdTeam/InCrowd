import { useNavigate } from 'react-router-dom'
import { Card, Button, Icon } from '@/components/ui'

export default function NotFound() {
  const navigate = useNavigate()

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

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
            margin: '0 auto 18px',
            background: 'var(--surface-3)',
            color: 'var(--ink-3)',
          }}
        >
          <Icon name="search" size={32} />
        </div>

        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px,12vw,80px)',
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-.04em',
            background: 'linear-gradient(110deg, var(--brand) 0%, var(--brand-700) 70%, #7a1d2e 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          404
        </div>

        <h2 style={{ marginTop: 6, fontSize: 'clamp(22px,4.5vw,28px)', fontWeight: 800, color: 'var(--ink)' }}>
          Pagina non trovata
        </h2>
        <p style={{ marginTop: 12, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5 }}>
          La pagina che cerchi non esiste o è stata spostata.
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
          <Button icon="home" onClick={() => navigate('/')}>
            Torna alla Home
          </Button>
          <Button variant="ghost" icon="arrowleft" onClick={goBack}>
            Indietro
          </Button>
        </div>
      </Card>
    </div>
  )
}
