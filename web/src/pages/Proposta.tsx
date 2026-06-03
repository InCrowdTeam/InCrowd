import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { IProposta } from '@/types/Proposta'
import type { IUser } from '@/types/User'
import {
  getCommenti,
  addCommento,
  deleteCommento,
  toggleHyperProposta,
} from '@/api/propostaApi'
import { PropostaService } from '@/services/PropostaService'
import { UserService } from '@/services/UserService'
import { DateService } from '@/services/DateService'
import { useUserStore, selectCanHype, selectIsOperatore } from '@/stores/userStore'
import { useAuthor } from '@/hooks/useAuthor'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { CATEGORIES } from '@/config/categorie'
import { processImageUrl } from '@/utils/image'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CatTag,
  Hype,
  Icon,
  ImgPlaceholder,
} from '@/components/ui'

/** Commento (shape per backend / PropostaService.loadCommenti). */
interface ICommento {
  _id: string
  contenuto: string
  utente?: IUser
  createdAt?: string
}

/** Riconosce un ente: usa userType/user_type, fallback "ha nome ma non cognome". */
function isEnte(user?: IUser | null): boolean {
  if (!user) return false
  const type = (user as any).userType ?? user.user_type
  if (type) return type === 'ente'
  return !!user.nome && !user.cognome
}

export default function Proposta() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const mobile = useIsMobile()

  const user = useUserStore((s) => s.user)
  const token = useUserStore((s) => s.token)
  const canHype = useUserStore(selectCanHype)
  const isOperatore = useUserStore(selectIsOperatore)
  const userId: string | undefined = user?._id

  const [proposta, setProposta] = useState<IProposta | null>(null)
  const [loadError, setLoadError] = useState<string>('')

  // hype overlay ottimistico
  const [hypeOverride, setHypeOverride] = useState<{ count: number; active: boolean } | null>(null)
  const [hypeBusy, setHypeBusy] = useState(false)

  // supporters (enti che hanno messo hyper)
  const [supporters, setSupporters] = useState<IUser[]>([])
  const [supportersLoading, setSupportersLoading] = useState(false)

  // commenti
  const [commenti, setCommenti] = useState<ICommento[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)

  const author = useAuthor(proposta?.proponenteID)

  /* ---- caricamento proposta ---- */
  useEffect(() => {
    if (!id) return
    let cancelled = false
    PropostaService.loadProposta(id, token || undefined)
      .then((p) => {
        if (!cancelled) {
          setProposta(p)
          setLoadError('')
        }
      })
      .catch((e: any) => {
        if (!cancelled) setLoadError(e?.message || 'Impossibile caricare la proposta. Riprova più tardi.')
      })
    return () => {
      cancelled = true
    }
  }, [id, token])

  /* ---- caricamento commenti ---- */
  const loadCommenti = useCallback(async () => {
    if (!proposta) return
    try {
      const data = await getCommenti(proposta._id)
      setCommenti(data?.commenti ?? [])
    } catch (e) {
      console.error('Errore nel caricamento commenti:', e)
      setCommenti([])
    } finally {
      setCommentsLoading(false)
    }
  }, [proposta])

  /* ---- caricamento enti che supportano (risolve listaHyper) ---- */
  const loadSupporters = useCallback(async (lista?: readonly string[]) => {
    const ids = lista ?? []
    try {
      const users = await Promise.all(ids.map((uid) => UserService.loadUser(uid)))
      setSupporters(users.filter((u): u is IUser => u !== null && isEnte(u)))
    } catch (e) {
      console.error('Errore nel caricamento dei sostenitori:', e)
      setSupporters([])
    } finally {
      setSupportersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!proposta) return
    let cancelled = false
    const pid = proposta._id
    const lista = proposta.listaHyper ?? []

    getCommenti(pid)
      .then((data) => {
        if (!cancelled) setCommenti(data?.commenti ?? [])
      })
      .catch((e) => {
        console.error('Errore nel caricamento commenti:', e)
        if (!cancelled) setCommenti([])
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false)
      })

    Promise.all(lista.map((uid) => UserService.loadUser(uid)))
      .then((users) => {
        if (!cancelled) setSupporters(users.filter((u): u is IUser => u !== null && isEnte(u)))
      })
      .catch((e) => {
        console.error('Errore nel caricamento dei sostenitori:', e)
        if (!cancelled) setSupporters([])
      })
      .finally(() => {
        if (!cancelled) setSupportersLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [proposta])

  /* ---- hype ---- */
  const baseCount = proposta?.listaHyper?.length ?? 0
  const baseActive = !!userId && (proposta?.listaHyper ?? []).includes(userId)
  const hypeCount = hypeOverride?.count ?? baseCount
  const hypeActive = hypeOverride?.active ?? baseActive

  const onHype = async () => {
    if (!canHype || !token || !proposta || hypeBusy) return
    const wasActive = hypeActive
    const current = hypeCount
    setHypeOverride({ active: !wasActive, count: current + (wasActive ? -1 : 1) })
    setHypeBusy(true)
    try {
      const updated = await toggleHyperProposta(proposta._id, token)
      setProposta(updated)
      setHypeOverride(null)
      await loadSupporters(updated.listaHyper)
    } catch (e) {
      console.error('Errore nel toggle hyper:', e)
      setHypeOverride({ active: wasActive, count: current })
    } finally {
      setHypeBusy(false)
    }
  }

  /* ---- commenti: invio / eliminazione ---- */
  const canComment = canHype // solo privato/ente (come il backend per hype/commenti)

  const post = async () => {
    const testo = draft.trim()
    if (!testo || !proposta || !token || !userId || posting) return
    setPosting(true)
    setDraft('')
    try {
      await addCommento(proposta._id, testo, token)
      await loadCommenti()
    } catch (e) {
      console.error("Errore nell'invio del commento:", e)
      setDraft(testo) // ripristina in caso di errore
    } finally {
      setPosting(false)
    }
  }

  const canDelete = (c: ICommento): boolean => {
    if (!user) return false
    if (c.utente?._id === userId) return true
    return isOperatore
  }

  const removeComment = async (commentoId: string) => {
    if (!proposta || !token || !commentoId) return
    if (!window.confirm('Sei sicuro di voler eliminare questo commento?')) return
    try {
      await deleteCommento(proposta._id, commentoId, token)
      await loadCommenti()
    } catch (e) {
      console.error("Errore nell'eliminazione del commento:", e)
    }
  }

  /* ---- stati di pagina ---- */
  if (loadError) {
    return (
      <PageWrap>
        <Card className="fade-in" pad="48px 32px" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--surface-3)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 18px',
            }}
          >
            <Icon name="x" size={30} style={{ color: 'var(--brand)' }} />
          </div>
          <h2 style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>Proposta non disponibile</h2>
          <p style={{ fontSize: 14.5, color: 'var(--ink-3)', marginBottom: 20, maxWidth: 460, marginInline: 'auto' }}>
            {loadError}
          </p>
          <div style={{ display: 'inline-flex' }}>
            <Button icon="arrowleft" onClick={() => navigate('/')}>
              Torna alla home
            </Button>
          </div>
        </Card>
      </PageWrap>
    )
  }

  if (!proposta) {
    return (
      <PageWrap>
        <div style={{ textAlign: 'center', padding: '90px 20px', color: 'var(--ink-3)' }}>Caricamento proposta…</div>
      </PageWrap>
    )
  }

  const cat = proposta.categoria ? CATEGORIES[proposta.categoria] : undefined
  const img = processImageUrl(proposta.foto)
  const luogo = proposta.luogo
  const addressLine = luogo
    ? [luogo.via, luogo.civico ? `n. ${luogo.civico}` : ''].filter(Boolean).join(', ')
    : ''

  return (
    <PageWrap>
      {/* hero card */}
      <Card pad="0" className="fade-in" style={{ overflow: 'hidden' }}>
        <div style={{ position: 'relative' }}>
          {img ? (
            <img
              src={img}
              alt={proposta.titolo}
              style={{ display: 'block', width: '100%', aspectRatio: mobile ? '16/10' : '21/9', objectFit: 'cover' }}
            />
          ) : (
            <ImgPlaceholder cat={proposta.categoria} label={cat?.label.toLowerCase()} radius="0" ratio={mobile ? '16/10' : '21/9'} />
          )}
          {cat && (
            <div style={{ position: 'absolute', top: 16, left: 16 }}>
              <CatTag cat={proposta.categoria} solid />
            </div>
          )}
          <button
            onClick={() => navigate(-1)}
            className="ic-btn"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--ink)',
              color: 'var(--ink-inv)',
              fontWeight: 700,
              fontSize: 13.5,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <Icon name="arrowleft" size={16} />
            Indietro
          </button>
        </div>

        <div style={{ padding: 'clamp(20px,3vw,30px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: 'clamp(26px,4vw,38px)',
                fontWeight: 800,
                color: 'var(--ink)',
                textWrap: 'balance',
                flex: 1,
                minWidth: 240,
              }}
            >
              {proposta.titolo}
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Hype count={hypeCount} active={hypeActive} onToggle={onHype} size="lg" disabled={!canHype || hypeBusy} />
              <span
                style={{
                  fontSize: 11.5,
                  color: 'var(--ink-3)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                }}
              >
                Hype
              </span>
              {!canHype && (
                <span style={{ fontSize: 11, color: 'var(--ink-3)', fontStyle: 'italic', textAlign: 'center', maxWidth: 150 }}>
                  {isOperatore ? 'Gli operatori non possono mettere hype' : 'Effettua il login per mettere hype'}
                </span>
              )}
            </div>
          </div>

          {/* autore */}
          <button
            onClick={() => author?._id && navigate(`/users/${author._id}`)}
            className="ic-btn"
            disabled={!author?._id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 16,
              padding: '7px 14px 7px 7px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--brand-soft)',
              transition: 'all .16s var(--ease)',
              cursor: author?._id ? 'pointer' : 'default',
            }}
          >
            <Avatar user={author} fetchAvatar size={34} />
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: 10.5,
                  color: 'var(--ink-3)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                Proposto da
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--brand-700)' }}>
                {author ? UserService.getFullName(author) : '…'}
              </div>
            </div>
          </button>

          <p style={{ marginTop: 18, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: 640, whiteSpace: 'pre-wrap' }}>
            {proposta.descrizione}
          </p>

          {/* info grid */}
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', marginTop: 24 }}>
            <InfoBox icon="pin" label="Dove" title={luogo?.citta || 'Non specificato'}>
              {addressLine && <div style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{addressLine}</div>}
              {luogo?.cap && <Badge style={{ marginTop: 8 }}>CAP {luogo.cap}</Badge>}
            </InfoBox>
            <InfoBox
              icon="calendar"
              label="Quando"
              title={proposta.dataIpotetica ? DateService.formatEventDate(proposta.dataIpotetica.toString()) : 'Data da definire'}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Badge icon="edit">Creata {DateService.formatRelativeDate(proposta.createdAt.toString())}</Badge>
          </div>
        </div>
      </Card>

      {/* enti che supportano */}
      {(supporters.length > 0 || supportersLoading) && (
        <Card className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'var(--hype)',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 3px 9px rgba(245,144,0,.4)',
                }}
              >
                <Icon name="bolt" size={18} fill="#3a2600" stroke={0} />
              </span>
              <h2 style={{ fontSize: 19, fontWeight: 700 }}>Enti che sostengono</h2>
            </div>
            {supporters.length > 0 && (
              <Badge color="#fff" bg="var(--brand)">
                {supporters.length} {supporters.length === 1 ? 'Ente' : 'Enti'}
              </Badge>
            )}
          </div>

          {supportersLoading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--ink-3)' }}>Caricamento sostenitori…</div>
          ) : (
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill,minmax(220px,1fr))' }}>
              {supporters.map((s) => (
                <button
                  key={s._id}
                  onClick={() => navigate(`/users/${s._id}`)}
                  className="ic-card-hover"
                  style={{
                    display: 'flex',
                    gap: 11,
                    alignItems: 'center',
                    padding: 13,
                    borderRadius: 'var(--r-md)',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <Avatar user={s} fetchAvatar size={42} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {UserService.getFullName(s)}
                    </div>
                    {s.biografia && (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--ink-3)',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {s.biografia}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* commenti */}
      <Card className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Icon name="comment" size={22} stroke={2} style={{ color: 'var(--brand)' }} />
            <h2 style={{ fontSize: 19, fontWeight: 700 }}>Commenti</h2>
          </div>
          <Badge color="#fff" bg="var(--brand)">
            {commenti.length} {commenti.length === 1 ? 'commento' : 'commenti'}
          </Badge>
        </div>

        {/* form / gate */}
        {canComment ? (
          <div style={{ display: 'flex', gap: 11, marginBottom: 22 }}>
            <Avatar user={user as IUser} fetchAvatar size={40} />
            <div style={{ flex: 1 }}>
              <textarea
                className="ic-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                maxLength={500}
                disabled={posting}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') post()
                }}
                placeholder="Scrivi un commento…"
                style={{ resize: 'vertical', minHeight: 74 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {draft.length}/500 · Ctrl+Invio
                </span>
                <Button icon="send" size="sm" onClick={post} disabled={posting || !draft.trim()}>
                  {posting ? 'Invio…' : 'Pubblica'}
                </Button>
              </div>
            </div>
          </div>
        ) : isOperatore ? (
          <GateCard
            icon="shield"
            title="Funzione commenti non disponibile"
            text="Gli operatori non possono aggiungere commenti alle proposte per mantenere la neutralità della moderazione."
          />
        ) : token ? (
          <GateCard
            icon="shield"
            title="Funzione non disponibile"
            text="Solo gli utenti e gli enti possono commentare le proposte."
          />
        ) : (
          <GateCard
            icon="user"
            title="Partecipa alla discussione"
            text="Effettua il login per lasciare un commento."
            action={<Button onClick={() => navigate('/login')}>Accedi</Button>}
          />
        )}

        {/* lista commenti */}
        {commentsLoading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ink-3)' }}>Caricamento commenti…</div>
        ) : commenti.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ink-3)' }}>
            <Icon name="comment" size={30} style={{ opacity: 0.4, margin: '0 auto 10px' }} />
            <div style={{ fontWeight: 700, color: 'var(--ink-2)' }}>Nessun commento ancora</div>
            <div style={{ fontSize: 13.5 }}>Sii il primo a commentare questa proposta!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {commenti.map((c) => (
              <CommentRow key={c._id} c={c} canDelete={canDelete(c)} onDelete={() => removeComment(c._id)} />
            ))}
          </div>
        )}
      </Card>
    </PageWrap>
  )
}

/* ---- sotto-componenti locali ---- */

function PageWrap({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: 'clamp(16px,3vw,28px) clamp(14px,4vw,24px) 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s-5)',
      }}
    >
      {children}
    </div>
  )
}

function InfoBox({ icon, label, title, children }: { icon: string; label: string; title: string; children?: ReactNode }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <Icon name={icon} size={15} stroke={2} style={{ color: 'var(--brand)' }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
      {children}
    </div>
  )
}

function GateCard({ icon, title, text, action }: { icon: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        padding: '20px 22px',
        marginBottom: 22,
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)',
        border: '1px dashed var(--border)',
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--r-md)',
          background: 'var(--surface-3)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={22} style={{ color: 'var(--brand)' }} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>{title}</h3>
        <p style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.45 }}>{text}</p>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

function CommentRow({ c, canDelete, onDelete }: { c: ICommento; canDelete: boolean; onDelete: () => void }) {
  const u = c.utente
  return (
    <div style={{ display: 'flex', gap: 11 }}>
      <Avatar user={u} fetchAvatar size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: 'var(--surface-3)', borderRadius: 'var(--r-md)', padding: '11px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{UserService.getCommentUserName(c)}</span>
            {((u as { user_type?: string; userType?: string })?.user_type === 'ente' ||
              (u as { user_type?: string; userType?: string })?.userType === 'ente') && (
              <Badge color="var(--cat-cultura)" bg="var(--cat-cultura-soft)">
                Ente
              </Badge>
            )}
            {c.createdAt && <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>· {DateService.formatRelativeDate(c.createdAt)}</span>}
            {canDelete && (
              <button
                onClick={onDelete}
                title="Elimina commento"
                className="ic-btn"
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  color: 'var(--ink-3)',
                  cursor: 'pointer',
                }}
              >
                <Icon name="trash" size={15} />
              </button>
            )}
          </div>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{c.contenuto}</p>
        </div>
      </div>
    </div>
  )
}
