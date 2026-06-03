import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IProposta } from '@/types/Proposta'
import { getPendingProposte, changePropostaState } from '@/api/propostaApi'
import { useUserStore } from '@/stores/userStore'
import { useAuthor } from '@/hooks/useAuthor'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { UserService } from '@/services/UserService'
import { processImageUrl } from '@/utils/image'
import { CATEGORIES } from '@/config/categorie'
import { Avatar, Badge, Button, Card, CatTag, Icon, ImgPlaceholder, SectionTitle } from '@/components/ui'

function asPropostaArray(data: unknown): IProposta[] {
  if (Array.isArray(data)) return data as IProposta[]
  const d = data as { proposte?: IProposta[] } | null
  return d?.proposte ?? []
}

export default function ModerationPanel() {
  const navigate = useNavigate()
  const token = useUserStore((s) => s.token)
  const mobile = useIsMobile()

  const [items, setItems] = useState<IProposta[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // errore di un'azione (approva/rifiuta): NON deve smontare la lista, a
  // differenza dell'errore di caricamento (Vue: showError modale, lista intatta).
  const [actionError, setActionError] = useState('')
  // id della proposta su cui è aperto il pannello di conferma + tipo di azione
  const [confirm, setConfirm] = useState<{ id: string; action: 'approvata' | 'rifiutata' } | null>(null)
  // id in fase di aggiornamento (disabilita i pulsanti)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getPendingProposte(token)
      .then((data) => {
        if (!cancelled) setItems(asPropostaArray(data))
      })
      .catch((err: unknown) => {
        console.error('Errore nel caricamento proposte:', err)
        if (!cancelled) setError(err instanceof Error ? err.message : 'Errore nel caricamento delle proposte')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (p) =>
        (p.titolo ?? '').toLowerCase().includes(q) || (p.descrizione ?? '').toLowerCase().includes(q),
    )
  }, [items, search])

  const applyState = async (id: string, action: 'approvata' | 'rifiutata') => {
    if (!token) return
    const commento =
      action === 'approvata' ? 'Proposta approvata dall\'operatore' : 'Proposta rifiutata dall\'operatore'
    setBusy(id)
    setActionError('')
    try {
      await changePropostaState(id, action, token, commento)
      setItems((l) => l.filter((p) => p._id !== id))
      setConfirm(null)
    } catch (err: unknown) {
      console.error("Errore nell'aggiornamento stato:", err)
      setActionError(
        err instanceof Error ? err.message : "Errore nell'aggiornamento dello stato della proposta",
      )
    } finally {
      setBusy(null)
    }
  }

  const count = filtered.length

  return (
    <div
      style={{
        maxWidth: 'var(--maxw)',
        margin: '0 auto',
        padding: 'clamp(16px,3vw,28px) clamp(14px,4vw,28px) 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s-5)',
      }}
    >
      <SectionTitle
        sub="Revisiona e gestisci le proposte in attesa di approvazione"
        action={
          !loading ? (
            <Badge color="var(--ink-2)" bg="var(--surface-3)">
              {count} {count === 1 ? 'proposta' : 'proposte'}
            </Badge>
          ) : undefined
        }
      >
        Moderazione proposte
      </SectionTitle>

      {/* ricerca */}
      <Card pad="16px">
        <div style={{ position: 'relative' }}>
          <Icon
            name="search"
            size={18}
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}
          />
          <input
            className="ic-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca proposte per titolo o descrizione…"
            style={{ paddingLeft: 42, borderRadius: 'var(--r-pill)' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Pulisci ricerca"
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--ink-3)',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
              }}
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
      </Card>

      {actionError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 'var(--r-md)',
            background: 'var(--brand-soft)',
            color: 'var(--brand-700)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Icon name="bolt" size={18} stroke={2.2} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{actionError}</span>
          <button
            onClick={() => setActionError('')}
            aria-label="Chiudi"
            style={{
              display: 'grid',
              placeItems: 'center',
              color: 'var(--brand-700)',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--ink-3)' }}>Caricamento proposte…</div>
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
          <p style={{ color: 'var(--ink-3)', marginTop: 6 }}>{error}</p>
        </Card>
      ) : count === 0 ? (
        <Card pad="50px" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--cat-sport-soft)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 14px',
            }}
          >
            <Icon name="check" size={30} stroke={2.5} style={{ color: 'var(--cat-sport)' }} />
          </div>
          <h3 style={{ fontSize: 20 }}>{search ? 'Nessuna proposta trovata' : 'Tutto pulito!'}</h3>
          <p style={{ color: 'var(--ink-3)', marginTop: 6 }}>
            {search ? 'Prova a modificare i termini di ricerca.' : 'Nessuna proposta in attesa di moderazione.'}
          </p>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 'var(--s-5)',
            gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(330px, 1fr))',
          }}
        >
          {filtered.map((p) => (
            <ModerationCard
              key={p._id}
              proposta={p}
              busy={busy === p._id}
              confirmAction={confirm?.id === p._id ? confirm.action : null}
              onAskConfirm={(action) => setConfirm({ id: p._id, action })}
              onCancelConfirm={() => setConfirm(null)}
              onConfirm={(action) => applyState(p._id, action)}
              onDetails={() => navigate(`/proposte/${p._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- card moderazione ---------- */

function ModerationCard({
  proposta,
  busy,
  confirmAction,
  onAskConfirm,
  onCancelConfirm,
  onConfirm,
  onDetails,
}: {
  proposta: IProposta
  busy: boolean
  confirmAction: 'approvata' | 'rifiutata' | null
  onAskConfirm: (action: 'approvata' | 'rifiutata') => void
  onCancelConfirm: () => void
  onConfirm: (action: 'approvata' | 'rifiutata') => void
  onDetails: () => void
}) {
  const author = useAuthor(proposta.proponenteID)
  const cat = proposta.categoria ? CATEGORIES[proposta.categoria] : undefined
  const img = processImageUrl(proposta.foto)
  const place = proposta.luogo?.citta

  return (
    <Card pad="0" style={{ overflow: 'hidden' }}>
      <div style={{ position: 'relative' }}>
        {img ? (
          <img
            src={img}
            alt={proposta.titolo}
            style={{ display: 'block', width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
          />
        ) : (
          <ImgPlaceholder cat={proposta.categoria} label={cat?.label.toLowerCase()} radius="0" ratio="16/9" />
        )}
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <CatTag cat={proposta.categoria} solid size="sm" />
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <Badge color="var(--hype-deep)" bg="#fff7e6" icon="hourglass">
            In attesa
          </Badge>
        </div>
      </div>

      <div style={{ padding: 18 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>{proposta.titolo}</h3>
        <p
          style={{
            fontSize: 13.5,
            color: 'var(--ink-2)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {proposta.descrizione}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            margin: '14px 0',
            padding: '10px 12px',
            borderRadius: 'var(--r-sm)',
            background: 'var(--surface-2)',
          }}
        >
          <Avatar user={author} fetchAvatar size={28} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ink-2)',
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {author ? UserService.getFullName(author) : '…'}
          </span>
          <span style={{ flex: 1 }} />
          {place && (
            <>
              <Icon name="pin" size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--ink-3)', flexShrink: 0 }}>{place}</span>
            </>
          )}
        </div>

        {confirmAction ? (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--r-sm)',
              background: 'var(--surface-3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              {confirmAction === 'approvata'
                ? `Sei sicuro di voler approvare "${proposta.titolo}"?`
                : `Stai per rifiutare la proposta "${proposta.titolo}". Questa azione non può essere annullata.`}
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <Button
                variant={confirmAction === 'approvata' ? 'success' : 'danger'}
                icon={confirmAction === 'approvata' ? 'check' : 'x'}
                size="sm"
                onClick={() => onConfirm(confirmAction)}
                disabled={busy}
              >
                {confirmAction === 'approvata' ? 'Approva' : 'Rifiuta'}
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancelConfirm} disabled={busy}>
                Annulla
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
            <Button variant="success" icon="check" size="sm" onClick={() => onAskConfirm('approvata')} disabled={busy}>
              Approva
            </Button>
            <Button variant="danger" icon="x" size="sm" onClick={() => onAskConfirm('rifiutata')} disabled={busy}>
              Rifiuta
            </Button>
            <Button variant="ghost" icon="eye" size="sm" onClick={onDetails} disabled={busy}>
              Dettagli
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
