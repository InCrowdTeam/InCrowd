import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IUser } from '@/types/User'
import { getAllUsers } from '@/api/userApi'
import { useUserStore } from '@/stores/userStore'
import { UserService } from '@/services/UserService'
import { DateService } from '@/services/DateService'
import { Avatar, Button, Card, Icon, RoleBadge } from '@/components/ui'

type FilterType = 'all' | 'privato' | 'ente'
type SortBy = 'name' | 'date'

function userTypeOf(u: IUser): 'privato' | 'ente' {
  return (u.user_type ?? u.userType ?? 'privato') as 'privato' | 'ente'
}

function emailOf(u: IUser): string {
  // L'API può esporre l'email a livello root oppure dentro credenziali (fallback legacy).
  return (u as any).email || u.credenziali?.email || ''
}

/** Tinta stabile derivata dall'id, usata per il banner della card (come nel prototipo). */
const TINTS = [
  'var(--cat-cultura)',
  'var(--cat-concerti)',
  'var(--cat-mostre)',
  'var(--cat-sport)',
  'var(--cat-workshop)',
  'var(--cat-conferenze)',
]
function tintFor(seed?: string): string {
  if (!seed) return 'var(--brand)'
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]
}

export default function UserList() {
  const navigate = useNavigate()
  const token = useUserStore((s) => s.token)

  const [users, setUsers] = useState<IUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortBy>('name')

  useEffect(() => {
    let cancelled = false
    getAllUsers(token)
      .then((res) => {
        if (cancelled) return
        setUsers(res.data?.users ?? [])
      })
      .catch((e) => {
        if (cancelled) return
        console.error('Errore nel caricamento degli utenti:', e)
        setError(e instanceof Error ? e.message : 'Errore nel caricamento degli utenti')
        setUsers([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const filtered = useMemo(() => {
    let list = [...users]

    if (filter !== 'all') list = list.filter((u) => userTypeOf(u) === filter)

    if (q) {
      const s = q.toLowerCase()
      list = list.filter(
        (u) =>
          u.nome?.toLowerCase().includes(s) ||
          (u.cognome && u.cognome.toLowerCase().includes(s)) ||
          (u.biografia && u.biografia.toLowerCase().includes(s)),
      )
    }

    list.sort((a, b) => {
      if (sortBy === 'name') {
        return `${a.nome} ${a.cognome || ''}`.localeCompare(`${b.nome} ${b.cognome || ''}`)
      }
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return db - da
    })

    return list
  }, [users, filter, q, sortBy])

  const countUtenti = users.filter((u) => userTypeOf(u) === 'privato').length
  const countEnti = users.filter((u) => userTypeOf(u) === 'ente').length

  const contactUser = (u: IUser) => {
    const email = emailOf(u)
    if (!email) return
    const subject = encodeURIComponent('Contatto dalla piattaforma InCrowd')
    const body = encodeURIComponent(`Ciao ${u.nome},\n\n`)
    window.open(`mailto:${email}?subject=${subject}&body=${body}`)
  }

  return (
    <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: 'clamp(16px,3vw,28px) clamp(14px,4vw,28px) 80px' }}>
      {/* hero banner */}
      <div
        className="fade-in"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--r-lg)',
          marginBottom: 'var(--s-5)',
          background: 'linear-gradient(110deg, var(--ink) 0%, #3a2a24 100%)',
          color: '#fff',
          padding: 'clamp(24px,3vw,34px) clamp(22px,4vw,38px)',
        }}
      >
        <div style={{ position: 'absolute', right: -30, top: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,77,94,.18)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', flexWrap: 'wrap' }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: 'var(--brand)', display: 'grid', placeItems: 'center', boxShadow: '0 6px 18px rgba(255,77,94,.5)' }}>
            <Icon name="users" size={28} stroke={2} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 'clamp(24px,4vw,30px)', fontWeight: 800 }}>Gestione Utenti ed Enti</h1>
            <p style={{ color: 'rgba(255,255,255,.82)', marginTop: 5, fontSize: 'clamp(14px,2vw,15.5px)' }}>
              Visualizza e gestisci tutti gli utenti ed enti registrati sulla piattaforma
            </p>
          </div>
          {!loading && (
            <div style={{ display: 'flex', gap: 22, position: 'relative' }}>
              <HeroStat n={filtered.length} label={filtered.length === 1 ? 'Risultato' : 'Risultati'} />
              <HeroStat n={countUtenti} label="Utenti" />
              <HeroStat n={countEnti} label="Enti" />
            </div>
          )}
        </div>
      </div>

      {/* ricerca + filtri */}
      <Card pad="16px" style={{ marginBottom: 'var(--s-5)' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Icon name="search" size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }} />
            <input
              className="ic-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca per nome o biografia…"
              style={{ paddingLeft: 42, borderRadius: 'var(--r-pill)' }}
            />
          </div>
          <div style={{ display: 'inline-flex', background: 'var(--surface-3)', borderRadius: 'var(--r-pill)', padding: 4, gap: 3 }}>
            {([
              { id: 'all', l: 'Tutti' },
              { id: 'privato', l: 'Utenti' },
              { id: 'ente', l: 'Enti' },
            ] as const).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '8px 15px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: filter === f.id ? '#fff' : 'var(--ink-2)',
                  background: filter === f.id ? 'var(--brand)' : 'transparent',
                  transition: 'all .16s var(--ease)',
                }}
              >
                {f.l}
              </button>
            ))}
          </div>
          <select
            className="ic-input"
            style={{ width: 'auto', flex: '0 0 auto', borderRadius: 'var(--r-pill)' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            <option value="name">Ordina per nome</option>
            <option value="date">Ordina per registrazione</option>
          </select>
        </div>
      </Card>

      {/* stati */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--ink-3)' }}>Caricamento utenti…</div>
      ) : error ? (
        <EmptyBox icon="x" title="Errore nel caricamento" text={error} />
      ) : filtered.length === 0 ? (
        <EmptyBox
          icon="user"
          title={q ? 'Nessun utente trovato' : 'Nessun utente registrato'}
          text={q ? 'Prova a modificare i termini di ricerca.' : 'Non ci sono ancora utenti registrati sulla piattaforma.'}
        />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--s-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {filtered.map((u) => {
            const type = userTypeOf(u)
            const email = emailOf(u)
            return (
              <Card key={u._id} pad="0" className="fade-in" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 54, background: `linear-gradient(115deg, ${tintFor(u._id)}, color-mix(in srgb, ${tintFor(u._id)} 50%, var(--brand)))` }} />
                <div style={{ padding: '0 18px 18px', marginTop: -26, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Avatar user={u} fetchAvatar size={56} ring />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--ink)' }}>{UserService.getFullName(u)}</h3>
                    <RoleBadge type={type} />
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3, wordBreak: 'break-word' }}>
                    {email || 'Email non disponibile'}
                  </div>
                  {u.biografia && (
                    <p
                      style={{
                        fontSize: 13.5,
                        color: 'var(--ink-2)',
                        marginTop: 10,
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {u.biografia}
                    </p>
                  )}
                  <div style={{ flex: 1 }} />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                      {u.createdAt ? `Reg. ${DateService.formatDate(u.createdAt as unknown as string)}` : ''}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="ghost" icon="eye" size="sm" onClick={() => navigate(`/users/${u._id}`)}>
                        Profilo
                      </Button>
                      {email && (
                        <Button variant="soft" icon="mail" size="sm" onClick={() => contactUser(u)}>
                          Contatta
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function HeroStat({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', fontWeight: 600, marginTop: 3 }}>{label}</div>
    </div>
  )
}

function EmptyBox({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--ink-3)' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface-3)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
        <Icon name={icon} size={30} />
      </div>
      <h3 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 14.5 }}>{text}</p>
    </div>
  )
}
