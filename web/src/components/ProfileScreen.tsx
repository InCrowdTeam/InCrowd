import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IProposta } from '@/types/Proposta'
import type { IUser } from '@/types/User'
import { getAllProposte, getUserProposte, toggleHyperProposta } from '@/api/propostaApi'
import { getUserById, updateProfile, getCurrentUser, deleteAccount } from '@/api/userApi'
import { useUserStore, selectCanHype, selectIsOperatore } from '@/stores/userStore'
import { useFollowStore } from '@/stores/followStore'
import { UserService } from '@/services/UserService'
import { ProposalCard } from '@/components/ProposalCard'
import { Avatar, Button, Card, Icon, PillTabs, RoleBadge } from '@/components/ui'
import { useIsMobile } from '@/hooks/useMediaQuery'

type Tab = 'proposte' | 'hyped' | 'seguiti'

function asPropostaArray(data: unknown): IProposta[] {
  if (Array.isArray(data)) return data as IProposta[]
  const d = data as { proposte?: IProposta[] } | null
  return d?.proposte ?? []
}

function tintFromId(seed?: string): string {
  const palette = [
    'var(--cat-cultura)',
    'var(--cat-concerti)',
    'var(--cat-mostre)',
    'var(--cat-sport)',
    'var(--cat-workshop)',
    'var(--cat-conferenze)',
    'var(--brand)',
  ]
  if (!seed) return 'var(--brand)'
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

export interface ProfileScreenProps {
  /** Id dell'utente del profilo da mostrare. */
  userId: string
  /** True se è il profilo dell'utente loggato. */
  isMe: boolean
}

/**
 * Schermata profilo condivisa (variante "Editoriale", da incrowd-profile.jsx).
 * Comportamento allineato a ProfiloView.vue (profilo proprio) e UserProfileView.vue
 * (profilo pubblico): proposte approvate dell'utente, proposte hypate (filtro su
 * getAllProposte come nelle Vue), utenti seguiti. Hype ottimistico come Home.tsx.
 */
export function ProfileScreen({ userId, isMe }: ProfileScreenProps) {
  const navigate = useNavigate()
  const mobile = useIsMobile()

  const currentUser = useUserStore((s) => s.user)
  const token = useUserStore((s) => s.token)
  const canHype = useUserStore(selectCanHype)
  const isOperatore = useUserStore(selectIsOperatore)
  const setUser = useUserStore((s) => s.setUser)
  const loggedIn = !!token

  const {
    loadFollowStatus,
    toggleFollow,
    loadFollowing,
    loadUserFollowStats,
    isFollowing: isFollowingFn,
  } = useFollowStore()

  // Profilo: se è il mio uso lo store, altrimenti carico via API.
  const [profile, setProfile] = useState<IUser | null>(isMe ? (currentUser as IUser) : null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [tab, setTab] = useState<Tab>('proposte')

  // Dati liste
  const [proposte, setProposte] = useState<IProposta[] | null>(null)
  const [hyped, setHyped] = useState<IProposta[] | null>(null)
  const [seguiti, setSeguiti] = useState<IUser[] | null>(null)

  // Stats follow
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 })

  // Follow toggle (solo profili altrui)
  const [following, setFollowing] = useState(false)
  const [loadingFollow, setLoadingFollow] = useState(false)

  // Hype overlay ottimistico (come Home.tsx)
  const [hype, setHype] = useState<Record<string, { count: number; active: boolean }>>({})

  // Modal modifica profilo
  const [showEdit, setShowEdit] = useState(false)

  /* ---------- caricamento profilo ---------- */
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        if (isMe) {
          // Profilo proprio: parto dallo store, ma se manca la bio ricarico (come ProfiloView).
          let me = currentUser as IUser | null
          if (token && (!me || !me.biografia)) {
            try {
              const res = await getCurrentUser(token)
              if (!cancelled && res.data?.user) {
                me = res.data.user
                setProfile(me)
                setUser(me)
              }
            } catch {
              /* ignora: tengo i dati dello store */
            }
          }
        } else {
          const res = await getUserById(userId)
          if (cancelled) return
          setProfile(res.data.user)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Utente non trovato')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isMe])

  /* ---------- proposte, hyped, stats follow (in parallelo) ---------- */
  useEffect(() => {
    if (loading || error) return
    let cancelled = false

    // Proposte approvate dell'utente
    getUserProposte(userId)
      .then((d) => !cancelled && setProposte(asPropostaArray(d)))
      .catch((e) => {
        console.error('Errore getUserProposte:', e)
        if (!cancelled) setProposte([])
      })

    // Hyped: filtro su tutte le proposte dove listaHyper include l'utente (come le Vue)
    getAllProposte()
      .then((d) => {
        if (cancelled) return
        const all = asPropostaArray(d)
        setHyped(all.filter((p) => p.listaHyper?.includes(userId)))
      })
      .catch((e) => {
        console.error('Errore getAllProposte (hyped):', e)
        if (!cancelled) setHyped([])
      })

    // Stats follow (follower / seguiti)
    loadUserFollowStats(userId)
      .then((s) => !cancelled && setFollowStats(s))
      .catch((e) => console.error('Errore loadUserFollowStats:', e))

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loading, error])

  /* ---------- follow status (solo profili altrui, loggato, non operatore) ---------- */
  useEffect(() => {
    if (loading || error || isMe || !loggedIn || isOperatore) return
    let cancelled = false
    loadFollowStatus(userId)
      .then((s) => !cancelled && setFollowing(!!s.isFollowing))
      .catch((e) => console.error('Errore loadFollowStatus:', e))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loading, error, isMe, loggedIn, isOperatore])

  /* ---------- caricamento seguiti (lazy al cambio tab) ---------- */
  useEffect(() => {
    if (tab !== 'seguiti' || seguiti !== null || loading || error) return
    let cancelled = false
    loadFollowing(userId)
      .then((list) => {
        if (cancelled) return
        setSeguiti(list)
        setFollowStats((s) => ({ ...s, followingCount: list.length }))
      })
      .catch((e) => {
        console.error('Errore loadFollowing:', e)
        if (!cancelled) setSeguiti([])
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, userId, loading, error])

  /* ---------- helpers hype ---------- */
  const myId = currentUser?._id
  const initialHyped = useCallback(
    (p: IProposta) => (myId ? (p.listaHyper ?? []).includes(myId) : false),
    [myId],
  )
  const getCount = (p: IProposta) => hype[p._id]?.count ?? p.listaHyper?.length ?? 0
  const getActive = (p: IProposta) => hype[p._id]?.active ?? initialHyped(p)

  const onHype = async (p: IProposta) => {
    if (!canHype || !token) return
    const wasActive = getActive(p)
    const base = getCount(p)
    setHype((h) => ({ ...h, [p._id]: { active: !wasActive, count: base + (wasActive ? -1 : 1) } }))
    try {
      await toggleHyperProposta(p._id, token)
    } catch (e) {
      console.error('Errore toggleHyper:', e)
      setHype((h) => ({ ...h, [p._id]: { active: wasActive, count: base } }))
    }
  }

  /* ---------- follow toggle ---------- */
  const onToggleFollow = async () => {
    if (!loggedIn) {
      navigate('/login')
      return
    }
    setLoadingFollow(true)
    const wasFollowing = following
    try {
      await toggleFollow(userId)
      const nowFollowing = isFollowingFn(userId)
      setFollowing(nowFollowing)
      setFollowStats((s) => ({
        ...s,
        followersCount: Math.max(0, s.followersCount + (nowFollowing ? 1 : -1)),
      }))
    } catch (e) {
      console.error('Errore toggleFollow:', e)
      setFollowing(wasFollowing)
    } finally {
      setLoadingFollow(false)
    }
  }

  const type = profile?.user_type ?? profile?.userType
  const fullName = profile ? UserService.getFullName(profile) : ''
  const tint = tintFromId(userId)

  const stats = useMemo(
    () => [
      { n: proposte?.length ?? 0, l: 'Proposte' },
      { n: hyped?.length ?? 0, l: 'Hyped' },
      { n: followStats.followersCount, l: 'Follower' },
      { n: followStats.followingCount, l: 'Seguiti' },
    ],
    [proposte, hyped, followStats],
  )

  /* ---------- aggiornamento dopo modifica profilo ---------- */
  const handleProfileSaved = (updated: IUser) => {
    setProfile(updated)
    setUser(updated)
    setShowEdit(false)
  }

  /* ---------- stati globali ---------- */
  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: '90px 20px', color: 'var(--ink-3)' }}>Caricamento profilo…</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--ink-3)' }}>
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
            <Icon name="user" size={30} />
          </div>
          <h3 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>Utente non trovato</h3>
          <p style={{ fontSize: 14.5, marginBottom: 18 }}>{error || 'Il profilo richiesto non esiste.'}</p>
          <div style={{ display: 'inline-flex' }}>
            <Button onClick={() => navigate('/')}>Torna alla home</Button>
          </div>
        </div>
      </div>
    )
  }

  const showFollowBtn = !isMe && loggedIn && !isOperatore

  return (
    <div style={{ ...pageStyle, display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
      {/* ---------- header ---------- */}
      <Card pad="0" className="fade-in" style={{ overflow: 'hidden' }}>
        <div
          style={{
            height: mobile ? 80 : 120,
            background: `linear-gradient(115deg, ${tint}, color-mix(in srgb, ${tint} 40%, var(--brand)))`,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -20,
              top: -30,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.12)',
            }}
          />
        </div>
        <div style={{ padding: '0 clamp(18px,3vw,28px) 24px', marginTop: mobile ? -36 : -46, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
            <div
              style={{
                border: '5px solid var(--surface)',
                borderRadius: '50%',
                boxShadow: 'var(--shadow-md)',
                lineHeight: 0,
              }}
            >
              <Avatar user={profile} fetchAvatar size={mobile ? 80 : 100} tint={tint} />
            </div>
            <div style={{ flex: 1, minWidth: 200, paddingBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'clamp(24px,3.5vw,32px)', fontWeight: 800 }}>{fullName}</h1>
                <RoleBadge type={type} />
              </div>
            </div>
            {isMe ? (
              <Button variant="ghost" icon="edit" onClick={() => setShowEdit(true)}>
                Modifica profilo
              </Button>
            ) : showFollowBtn ? (
              <Button
                variant={following ? 'ghost' : 'primary'}
                icon={following ? 'check' : 'plus'}
                onClick={onToggleFollow}
                disabled={loadingFollow}
              >
                {following ? 'Segui già' : 'Segui'}
              </Button>
            ) : null}
          </div>

          {isMe && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                marginTop: 16,
                padding: '11px 15px',
                borderRadius: 'var(--r-md)',
                background: 'var(--brand-soft)',
                color: 'var(--brand-700)',
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <Icon name="eye" size={17} />
              Questo è il tuo profilo pubblico — è così che ti vede la community.
            </div>
          )}

          <p style={{ marginTop: 14, fontSize: 15.5, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 560 }}>
            {profile.biografia || 'Nessuna biografia disponibile.'}
          </p>

          <div style={{ display: 'flex', gap: mobile ? 20 : 34, marginTop: 20 }}>
            {stats.map((s) => (
              <div key={s.l}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--brand)' }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ---------- tabs ---------- */}
      <div>
        <PillTabs
          full
          active={tab}
          onChange={(id) => setTab(id as Tab)}
          tabs={[
            { id: 'proposte', label: 'Proposte', icon: 'sparkle' },
            { id: 'hyped', label: 'Hyped', icon: 'bolt' },
            { id: 'seguiti', label: 'Seguiti', icon: 'users' },
          ]}
        />
      </div>

      {/* ---------- contenuto tab ---------- */}
      {tab === 'seguiti' ? (
        <FollowingTab
          seguiti={seguiti}
          mobile={mobile}
          onOpen={(id) => navigate(`/users/${id}`)}
          emptyName={fullName}
          isMe={isMe}
        />
      ) : (
        <ProposalsTab
          list={tab === 'proposte' ? proposte : hyped}
          tab={tab}
          mobile={mobile}
          isMe={isMe}
          emptyName={fullName}
          getCount={getCount}
          getActive={getActive}
          onHype={onHype}
          canHype={canHype}
          onOpen={(id) => navigate(`/proposte/${id}`)}
        />
      )}

      {/* ---------- modal modifica profilo ---------- */}
      {showEdit && isMe && (
        <EditProfileModal user={profile} token={token} onClose={() => setShowEdit(false)} onSaved={handleProfileSaved} />
      )}
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  maxWidth: 'var(--maxw)',
  margin: '0 auto',
  padding: 'clamp(16px,3vw,28px) clamp(14px,4vw,28px) 80px',
}

/* ============================================================ */
/* Tab proposte / hyped                                          */
/* ============================================================ */
function ProposalsTab({
  list,
  tab,
  mobile,
  isMe,
  emptyName,
  getCount,
  getActive,
  onHype,
  canHype,
  onOpen,
}: {
  list: IProposta[] | null
  tab: 'proposte' | 'hyped'
  mobile: boolean
  isMe: boolean
  emptyName: string
  getCount: (p: IProposta) => number
  getActive: (p: IProposta) => boolean
  onHype: (p: IProposta) => void
  canHype: boolean
  onOpen: (id: string) => void
}) {
  if (list === null) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--ink-3)' }}>Caricamento…</div>
  }
  if (list.length === 0) {
    const title = tab === 'hyped' ? 'Nessuna proposta hypata' : 'Nessuna proposta'
    const sub = isMe
      ? tab === 'hyped'
        ? 'Le proposte che hai sostenuto appariranno qui.'
        : 'Le tue proposte appariranno qui una volta pubblicate.'
      : tab === 'hyped'
        ? `${emptyName} non ha ancora sostenuto proposte.`
        : `${emptyName} non ha ancora pubblicato proposte approvate.`
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--ink-3)' }}>
        <Icon name={tab === 'hyped' ? 'bolt' : 'sparkle'} size={32} style={{ opacity: 0.4, margin: '0 auto 10px' }} />
        <div style={{ fontWeight: 700, color: 'var(--ink-2)' }}>{title}</div>
        <p style={{ fontSize: 14, marginTop: 6 }}>{sub}</p>
      </div>
    )
  }
  return (
    <div
      style={{
        display: 'grid',
        gap: mobile ? 16 : 'var(--s-5)',
        gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(258px, 1fr))',
      }}
    >
      {list.map((p) => (
        <ProposalCard
          key={p._id}
          proposta={p}
          count={getCount(p)}
          hyped={getActive(p)}
          onHype={() => onHype(p)}
          onOpen={() => onOpen(p._id)}
          hypeDisabled={!canHype}
        />
      ))}
    </div>
  )
}

/* ============================================================ */
/* Tab seguiti                                                   */
/* ============================================================ */
function FollowingTab({
  seguiti,
  mobile,
  onOpen,
  emptyName,
  isMe,
}: {
  seguiti: IUser[] | null
  mobile: boolean
  onOpen: (id: string) => void
  emptyName: string
  isMe: boolean
}) {
  if (seguiti === null) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--ink-3)' }}>Caricamento…</div>
  }
  if (seguiti.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--ink-3)' }}>
        <Icon name="users" size={32} style={{ opacity: 0.4, margin: '0 auto 10px' }} />
        <div style={{ fontWeight: 700, color: 'var(--ink-2)' }}>Nessun utente seguito</div>
        <p style={{ fontSize: 14, marginTop: 6 }}>
          {isMe ? 'Gli utenti che seguirai appariranno qui.' : `${emptyName} non segue ancora nessuno.`}
        </p>
      </div>
    )
  }
  return (
    <div
      style={{
        display: 'grid',
        gap: 14,
        gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))',
      }}
    >
      {seguiti.map((f) => (
        <Card key={f._id} hover onClick={() => onOpen(f._id)} pad="16px">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Avatar user={f} fetchAvatar size={46} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: 'var(--ink)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {UserService.getFullName(f)}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--ink-3)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {f.biografia || 'Nessuna biografia'}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

/* ============================================================ */
/* Modal modifica profilo (solo profilo proprio)                */
/* ============================================================ */
function EditProfileModal({
  user,
  token,
  onClose,
  onSaved,
}: {
  user: IUser
  token: string
  onClose: () => void
  onSaved: (u: IUser) => void
}) {
  const isEnte = (user.user_type ?? user.userType) === 'ente'
  const logout = useUserStore((s) => s.logout)
  const navigate = useNavigate()

  const [nome, setNome] = useState(user.nome || '')
  const [cognome, setCognome] = useState(user.cognome || '')
  const [biografia, setBiografia] = useState(user.biografia || '')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)

  const currentPhoto = preview || UserService.processUserAvatar(user) || null

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(f.type)) {
      setMessage({ text: 'Seleziona un file immagine valido (JPEG, PNG, GIF, WebP)', type: 'error' })
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setMessage({ text: 'Il file deve essere inferiore a 5MB', type: 'error' })
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const validate = (): boolean => {
    if (!nome.trim()) {
      setMessage({ text: 'Il nome è obbligatorio', type: 'error' })
      return false
    }
    if (!isEnte && !cognome.trim()) {
      setMessage({ text: 'Il cognome è obbligatorio', type: 'error' })
      return false
    }
    if (biografia.length > 500) {
      setMessage({ text: 'La biografia non può superare i 500 caratteri', type: 'error' })
      return false
    }
    return true
  }

  const onSave = async () => {
    if (!validate()) return
    setSaving(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append('nome', nome)
      if (!isEnte) formData.append('cognome', cognome)
      formData.append('biografia', biografia)
      if (file) formData.append('fotoProfilo', file)

      const result = await updateProfile(formData, token)
      if (result.data?.user) {
        UserService.clearAvatarCache()
        onSaved(result.data.user)
      }
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Errore durante l\'aggiornamento', type: 'error' })
      setSaving(false)
    }
  }

  const onDelete = async () => {
    const ok = window.confirm(
      `Stai per eliminare definitivamente il tuo ${isEnte ? 'ente' : 'account'}.\n\nVerranno cancellati il profilo, le proposte e i commenti.\nQuesta operazione NON può essere annullata.\n\nProcedere?`,
    )
    if (!ok) return
    setDeleting(true)
    setMessage(null)
    try {
      await deleteAccount(token)
      logout()
      navigate('/')
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Errore durante l\'eliminazione', type: 'error' })
      setDeleting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,.5)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
      className="fade-in"
    >
      <Card
        pad="0"
        style={{
          width: '100%',
          maxWidth: 540,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* impedisce la chiusura cliccando dentro */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
        >
          {/* header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 22px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h3 style={{ fontSize: 19, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 9 }}>
              <Icon name="edit" size={19} />
              Modifica profilo
            </h3>
            <button
              onClick={onClose}
              aria-label="Chiudi"
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 34,
                height: 34,
                borderRadius: 'var(--r-pill)',
                background: 'var(--surface-3)',
                color: 'var(--ink-2)',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          {/* body */}
          <div style={{ padding: '20px 22px', overflowY: 'auto' }}>
            {message && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '11px 15px',
                  borderRadius: 'var(--r-md)',
                  fontSize: 13.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  background: message.type === 'error' ? 'var(--brand-soft)' : 'var(--cat-sport-soft)',
                  color: message.type === 'error' ? 'var(--brand-700)' : 'var(--cat-sport)',
                }}
              >
                <Icon name={message.type === 'error' ? 'x' : 'check'} size={16} />
                {message.text}
              </div>
            )}

            {/* foto profilo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt="Foto profilo"
                  style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', boxShadow: 'var(--shadow-sm)' }}
                />
              ) : (
                <Avatar user={{ ...user, nome, cognome }} size={72} />
              )}
              <div>
                <label className="ic-btn" data-variant="ghost" style={ghostFakeBtn}>
                  <Icon name="camera" size={17} />
                  Cambia foto
                  <input type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
                </label>
                {preview && (
                  <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>
                    Anteprima — salva per applicare
                  </div>
                )}
              </div>
            </div>

            {/* nome */}
            <div style={{ marginBottom: 16 }}>
              <label className="ic-label">{isEnte ? 'Nome ente *' : 'Nome *'}</label>
              <input className="ic-input" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>

            {/* cognome (solo privati) */}
            {!isEnte && (
              <div style={{ marginBottom: 16 }}>
                <label className="ic-label">Cognome *</label>
                <input className="ic-input" value={cognome} onChange={(e) => setCognome(e.target.value)} />
              </div>
            )}

            {/* email (read-only) */}
            <div style={{ marginBottom: 16 }}>
              <label className="ic-label">
                <Icon name="mail" size={14} />
                Email
              </label>
              <input
                className="ic-input"
                value={user.credenziali?.email || 'Email non disponibile'}
                readOnly
                title="L'email non può essere modificata"
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            {/* biografia */}
            <div style={{ marginBottom: 4 }}>
              <label className="ic-label">Biografia</label>
              <textarea
                className="ic-input"
                rows={3}
                maxLength={500}
                value={biografia}
                onChange={(e) => setBiografia(e.target.value)}
                placeholder="Racconta qualcosa di te…"
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                {biografia.length}/500
              </div>
            </div>
          </div>

          {/* footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '16px 22px',
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}
          >
            <Button variant="danger" icon="trash" onClick={onDelete} disabled={deleting || saving}>
              {deleting ? 'Eliminazione…' : 'Elimina account'}
            </Button>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="ghost" icon="logout" onClick={() => { logout(); navigate('/') }} disabled={saving || deleting}>
                Esci
              </Button>
              <Button icon="check" onClick={onSave} disabled={saving || deleting}>
                {saving ? 'Salvataggio…' : 'Salva modifiche'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

const ghostFakeBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '11px 18px',
  fontSize: 14.5,
  fontWeight: 700,
  borderRadius: 'var(--r-pill)',
  background: 'transparent',
  color: 'var(--ink-2)',
  border: '1px solid var(--border)',
  cursor: 'pointer',
}
