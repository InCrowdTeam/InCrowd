import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOperatoreStats } from '@/api/operatoreApi'
import { useUserStore } from '@/stores/userStore'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { Card, Icon, SectionTitle } from '@/components/ui'

interface OperatorStats {
  proposteInAttesa: number
  proposteApprovate: number
  proposteRifiutate: number
  utentiRegistrati: number
  entiRegistrati: number
  commentiTotali: number
  utentiTotali: number
}

const EMPTY_STATS: OperatorStats = {
  proposteInAttesa: 0,
  proposteApprovate: 0,
  proposteRifiutate: 0,
  utentiRegistrati: 0,
  entiRegistrati: 0,
  commentiTotali: 0,
  utentiTotali: 0,
}

export default function PannelloOperatore() {
  const navigate = useNavigate()
  const token = useUserStore((s) => s.token)
  const mobile = useIsMobile()

  const [stats, setStats] = useState<OperatorStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getOperatoreStats(token)
      .then((data: Partial<OperatorStats>) => {
        if (!cancelled) setStats({ ...EMPTY_STATS, ...data })
      })
      .catch((err: unknown) => {
        console.error('Errore nel caricamento statistiche:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Errore nel caricamento delle statistiche')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div
      style={{
        maxWidth: 'var(--maxw)',
        margin: '0 auto',
        padding: 'clamp(16px,3vw,28px) clamp(14px,4vw,28px) 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s-6)',
      }}
    >
      {/* hero banner */}
      <div
        className="fade-in"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--r-lg)',
          background: 'linear-gradient(110deg, var(--ink) 0%, #3a2a24 100%)',
          color: '#fff',
          padding: mobile ? '24px 22px' : '34px 38px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -30,
            top: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,77,94,.18)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              background: 'var(--brand)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 6px 18px rgba(255,77,94,.5)',
              flexShrink: 0,
            }}
          >
            <Icon name="shield" size={28} stroke={2} />
          </div>
          <div>
            <h1 style={{ fontSize: mobile ? 24 : 30, fontWeight: 800 }}>Pannello Operatore</h1>
            <p style={{ color: 'rgba(255,255,255,.82)', marginTop: 5, fontSize: mobile ? 14 : 15.5 }}>
              Gestisci la community e mantieni un ambiente sicuro per tutti
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--ink-3)' }}>
          Caricamento pannello operatore…
        </div>
      ) : error ? (
        <Card pad="50px" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--brand-soft)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 14px',
            }}
          >
            <Icon name="bolt" size={30} stroke={2.2} style={{ color: 'var(--brand)' }} />
          </div>
          <h3 style={{ fontSize: 20, color: 'var(--ink)' }}>Errore nel caricamento</h3>
          <p style={{ color: 'var(--ink-3)', marginTop: 6, marginBottom: 18 }}>{error}</p>
          <button className="ic-btn" data-variant="primary" onClick={() => window.location.reload()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 18px',
              fontSize: 14.5,
              fontWeight: 700,
              borderRadius: 'var(--r-pill)',
              background: 'var(--brand)',
              color: '#fff',
              border: '1px solid transparent',
              boxShadow: '0 4px 14px rgba(255,77,94,.32)',
              cursor: 'pointer',
            }}
          >
            Riprova
          </button>
        </Card>
      ) : (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
          {/* panoramica */}
          <div>
            <SectionTitle>Panoramica</SectionTitle>
            <div
              style={{
                display: 'grid',
                gap: 'var(--s-4)',
                gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4,1fr)',
              }}
            >
              <StatCard
                icon="hourglass"
                n={stats.proposteInAttesa}
                label="Proposte in attesa"
                sub="Richiedono moderazione"
                color="var(--brand)"
              />
              <StatCard
                icon="check"
                n={stats.proposteApprovate}
                label="Proposte approvate"
                sub="Totale pubblicate"
                color="var(--cat-sport)"
              />
              <StatCard
                icon="users"
                n={stats.utentiTotali}
                label="Utenti registrati"
                sub="Community totale"
                color="var(--cat-workshop)"
              />
              <StatCard
                icon="x"
                n={stats.proposteRifiutate}
                label="Proposte rifiutate"
                sub="Totale respinte"
                color="var(--cat-mostre)"
              />
            </div>
          </div>

          {/* strumenti */}
          <div>
            <SectionTitle>Strumenti operatore</SectionTitle>
            <div
              style={{
                display: 'grid',
                gap: 'var(--s-4)',
                gridTemplateColumns: mobile ? '1fr' : 'repeat(3,1fr)',
              }}
            >
              <ToolCard
                featured
                icon="search"
                title="Moderazione proposte"
                badge={stats.proposteInAttesa}
                desc="Revisiona, approva o rifiuta le proposte degli utenti. Mantieni la qualità dei contenuti."
                stat={`${stats.proposteInAttesa} in attesa`}
                cta="Inizia moderazione"
                onClick={() => navigate('/moderation')}
              />
              <ToolCard
                icon="users"
                title="Gestione utenti"
                color="var(--cat-workshop)"
                desc="Visualizza e gestisci la lista degli utenti registrati. Monitora l'attività della community."
                stat={`${stats.utentiTotali} totali`}
                cta="Visualizza utenti"
                onClick={() => navigate('/users')}
              />
              <ToolCard
                icon="comment"
                title="Ultimi commenti"
                color="var(--cat-cultura)"
                desc="Visualizza gli ultimi commenti inseriti dagli utenti su tutte le proposte."
                stat={`${stats.commentiTotali} commenti`}
                cta="Visualizza commenti"
                onClick={() => navigate('/comments')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- sub-componenti ---------- */

function StatCard({
  icon,
  n,
  label,
  sub,
  color,
}: {
  icon: string
  n: number
  label: string
  sub: string
  color: string
}) {
  return (
    <Card pad="18px 20px" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: color }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: `color-mix(in srgb, ${color} 14%, transparent)`,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name={icon} size={22} stroke={2} style={{ color }} />
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, lineHeight: 1, color: 'var(--ink)' }}>
        {n}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 7 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>
    </Card>
  )
}

function ToolCard({
  featured,
  icon,
  title,
  desc,
  stat,
  cta,
  badge,
  color = 'var(--brand)',
  onClick,
}: {
  featured?: boolean
  icon: string
  title: string
  desc: string
  stat: string
  cta: string
  badge?: number
  color?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="ic-card-hover"
      style={{
        textAlign: 'left',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        padding: '22px 22px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        border: `1px solid ${featured ? 'transparent' : 'var(--border)'}`,
        boxShadow: 'var(--shadow-sm)',
        background: featured ? 'linear-gradient(135deg, var(--brand), var(--brand-700))' : 'var(--surface)',
        color: featured ? '#fff' : 'var(--ink)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            background: featured ? 'rgba(255,255,255,.18)' : `color-mix(in srgb, ${color} 14%, transparent)`,
          }}
        >
          <Icon name={icon} size={24} stroke={2} style={{ color: featured ? '#fff' : color }} />
        </div>
        {badge != null && badge > 0 && (
          <span
            style={{
              minWidth: 26,
              height: 26,
              padding: '0 8px',
              borderRadius: 13,
              display: 'grid',
              placeItems: 'center',
              background: featured ? '#fff' : 'var(--brand)',
              color: featured ? 'var(--brand)' : '#fff',
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <h3 style={{ fontSize: 19, fontWeight: 700 }}>{title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: featured ? 'rgba(255,255,255,.9)' : 'var(--ink-2)', flex: 1 }}>
        {desc}
      </p>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 'var(--r-pill)',
          alignSelf: 'flex-start',
          background: featured ? 'rgba(255,255,255,.18)' : 'var(--surface-3)',
          fontSize: 12.5,
          fontWeight: 700,
        }}
      >
        {stat}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontWeight: 700,
          fontSize: 14.5,
          marginTop: 4,
          color: featured ? '#fff' : color,
        }}
      >
        {cta}
        <Icon name="arrowright" size={16} />
      </div>
    </button>
  )
}
