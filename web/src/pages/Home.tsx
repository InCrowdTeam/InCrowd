import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IProposta } from '@/types/Proposta'
import type { IUser } from '@/types/User'
import {
  getAllProposte,
  getFollowedUsersProposte,
  searchProposte,
  toggleHyperProposta,
  type SearchFilters,
} from '@/api/propostaApi'
import { searchUsers } from '@/api/userApi'
import { useUserStore, selectCanHype } from '@/stores/userStore'
import { CATEGORIES, CAT_ORDER } from '@/config/categorie'
import { UserService } from '@/services/UserService'
import { ProposalCard } from '@/components/ProposalCard'
import { Avatar, Button, Card, Icon, PillTabs, RoleBadge } from '@/components/ui'

type Tab = 'esplora' | 'seguiti' | 'classifica'
type SearchType = 'proposte' | 'utenti'

function asPropostaArray(data: unknown): IProposta[] {
  if (Array.isArray(data)) return data as IProposta[]
  const d = data as { proposte?: IProposta[] } | null
  return d?.proposte ?? []
}

export default function Home() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const token = useUserStore((s) => s.token)
  const userType = useUserStore((s) => s.userType)
  const canHype = useUserStore(selectCanHype)
  const isOperatore = userType === 'operatore'
  const userId: string | undefined = user?._id

  const [tab, setTab] = useState<Tab>('esplora')
  const [proposte, setProposte] = useState<IProposta[]>([])
  // null = non ancora caricate (mostra "Caricamento…")
  const [seguiti, setSeguiti] = useState<IProposta[] | null>(null)
  const [activeCats, setActiveCats] = useState<string[]>([])

  // ricerca
  const [searchType, setSearchType] = useState<SearchType>('proposte')
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({ categoria: '', citta: '', stato: '', sortBy: 'createdAt', sortOrder: 'desc' })
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'privato' | 'ente'>('all')
  const [searchExecuted, setSearchExecuted] = useState(false)
  const [searchProp, setSearchProp] = useState<IProposta[]>([])
  const [searchUsr, setSearchUsr] = useState<IUser[]>([])

  // hype overlay: id -> conteggio override + stato attivo
  const [hype, setHype] = useState<Record<string, { count: number; active: boolean }>>({})

  /* ---- caricamenti ---- */
  useEffect(() => {
    getAllProposte()
      .then((d) => setProposte(asPropostaArray(d)))
      .catch((e) => console.error('Errore getAllProposte:', e))
  }, [])

  useEffect(() => {
    if (tab !== 'seguiti' || !token || isOperatore) return
    getFollowedUsersProposte(token)
      .then((d) => setSeguiti(asPropostaArray(d)))
      .catch((e) => {
        console.error('Errore getFollowedUsersProposte:', e)
        setSeguiti([])
      })
  }, [tab, token, isOperatore])

  /* ---- helpers hype ---- */
  const initialHyped = useCallback(
    (p: IProposta) => (userId ? (p.listaHyper ?? []).includes(userId) : false),
    [userId],
  )
  const getCount = (p: IProposta) => hype[p._id]?.count ?? p.listaHyper?.length ?? 0
  const getActive = (p: IProposta) => hype[p._id]?.active ?? initialHyped(p)

  const onHype = async (p: IProposta) => {
    if (!canHype || !token) return
    const wasActive = getActive(p)
    const base = getCount(p)
    // update ottimistico
    setHype((h) => ({ ...h, [p._id]: { active: !wasActive, count: base + (wasActive ? -1 : 1) } }))
    try {
      await toggleHyperProposta(p._id, token)
    } catch (e) {
      console.error('Errore toggleHyper:', e)
      setHype((h) => ({ ...h, [p._id]: { active: wasActive, count: base } }))
    }
  }

  /* ---- ricerca ---- */
  const runSearch = async () => {
    if (searchType === 'proposte') {
      try {
        const res = await searchProposte({ ...filters, q: query || undefined })
        setSearchProp(asPropostaArray(res))
      } catch (e) {
        console.error('Errore searchProposte:', e)
        setSearchProp([])
      }
    } else {
      try {
        const res = await searchUsers(query, userTypeFilter === 'all' ? undefined : userTypeFilter)
        setSearchUsr(res.data?.users ?? [])
      } catch (e) {
        console.error('Errore searchUsers:', e)
        setSearchUsr([])
      }
    }
    setSearchExecuted(true)
  }

  const clearSearch = () => {
    setQuery('')
    setSearchExecuted(false)
    setSearchProp([])
    setSearchUsr([])
    setFilters({ categoria: '', citta: '', stato: '', sortBy: 'createdAt', sortOrder: 'desc' })
  }

  const toggleCat = (c: string) => setActiveCats((a) => (a.includes(c) ? a.filter((x) => x !== c) : [...a, c]))

  /* ---- lista visualizzata ---- */
  const list = useMemo(() => {
    let l: IProposta[]
    if (tab === 'classifica') l = [...proposte].sort((a, b) => (b.listaHyper?.length ?? 0) - (a.listaHyper?.length ?? 0))
    else if (tab === 'seguiti') l = seguiti ?? []
    else l = proposte
    if (activeCats.length) l = l.filter((p) => p.categoria && activeCats.includes(p.categoria))
    return l
  }, [tab, proposte, seguiti, activeCats])

  const showingSearch = searchExecuted
  const bannerTitle = tab === 'classifica' ? 'Le più sostenute' : tab === 'seguiti' ? 'Dai tuoi seguiti' : 'Nuove Proposte'
  const bannerSub =
    tab === 'classifica'
      ? 'Le idee che la community sta spingendo di più'
      : tab === 'seguiti'
        ? 'Le ultime idee da chi segui'
        : 'Scopri le ultime idee della community'

  return (
    <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: 'clamp(18px,3vw,30px) clamp(14px,4vw,28px) 80px' }}>
      {/* ricerca */}
      <Card pad="22px 24px" style={{ marginBottom: 'var(--s-5)', borderRadius: 'var(--r-lg)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <PillTabs
            tabs={[
              { id: 'proposte', label: 'Proposte', icon: 'sparkle' },
              { id: 'utenti', label: 'Utenti', icon: 'users' },
            ]}
            active={searchType}
            onChange={(id) => {
              setSearchType(id as SearchType)
              clearSearch()
            }}
          />
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Icon
              name="search"
              size={19}
              style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}
            />
            <input
              className="ic-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder={
                searchType === 'proposte' ? 'Cerca proposte per titolo, luogo o descrizione…' : 'Cerca utenti per nome…'
              }
              style={{ paddingLeft: 44, borderRadius: 'var(--r-pill)' }}
            />
          </div>
          {searchType === 'proposte' && (
            <Button variant="ghost" icon="filter" onClick={() => setShowFilters((s) => !s)}>
              Filtri
            </Button>
          )}
          <Button icon="search" onClick={runSearch}>
            Cerca
          </Button>
          {showingSearch && (
            <Button variant="ghost" icon="x" onClick={clearSearch}>
              Pulisci
            </Button>
          )}
        </div>

        {searchType === 'proposte' && showFilters && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
            <select
              className="ic-input"
              style={{ width: 'auto', flex: '1 1 160px' }}
              value={filters.categoria}
              onChange={(e) => setFilters((f) => ({ ...f, categoria: e.target.value }))}
            >
              <option value="">Tutte le categorie</option>
              {CAT_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIES[c].label}
                </option>
              ))}
            </select>
            <input
              className="ic-input"
              style={{ width: 'auto', flex: '1 1 160px' }}
              placeholder="Città"
              value={filters.citta}
              onChange={(e) => setFilters((f) => ({ ...f, citta: e.target.value }))}
            />
            <select
              className="ic-input"
              style={{ width: 'auto', flex: '1 1 160px' }}
              value={filters.sortBy}
              onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as SearchFilters['sortBy'] }))}
            >
              <option value="createdAt">Più recenti</option>
              <option value="listaHyper">Più sostenute</option>
              <option value="titolo">Titolo</option>
            </select>
          </div>
        )}

        {searchType === 'utenti' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {(['all', 'privato', 'ente'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setUserTypeFilter(t)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 13.5,
                  fontWeight: 700,
                  border: `1px solid ${userTypeFilter === t ? 'transparent' : 'var(--border)'}`,
                  color: userTypeFilter === t ? '#fff' : 'var(--ink-2)',
                  background: userTypeFilter === t ? 'var(--ink)' : 'var(--surface)',
                }}
              >
                {t === 'all' ? 'Tutti' : t === 'privato' ? 'Utenti' : 'Enti'}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* risultati ricerca */}
      {showingSearch ? (
        searchType === 'utenti' ? (
          <UserGrid users={searchUsr} onOpen={(id) => navigate(`/users/${id}`)} />
        ) : searchProp.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <Grid>
            {searchProp.map((p) => (
              <ProposalCard
                key={p._id}
                proposta={p}
                count={getCount(p)}
                hyped={getActive(p)}
                onHype={() => onHype(p)}
                onOpen={() => navigate(`/proposte/${p._id}`)}
                hypeDisabled={!canHype}
              />
            ))}
          </Grid>
        )
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--s-6)' }}>
            <PillTabs
              tabs={[
                { id: 'esplora', label: 'Esplora', icon: 'globe' },
                { id: 'seguiti', label: 'Seguiti', icon: 'heart' },
                { id: 'classifica', label: 'Classifica', icon: 'trophy' },
              ]}
              active={tab}
              onChange={(id) => setTab(id as Tab)}
            />
          </div>

          {/* banner */}
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 'var(--r-lg)',
              marginBottom: 'var(--s-6)',
              background: 'linear-gradient(110deg, var(--brand) 0%, var(--brand-700) 60%, #7a1d2e 100%)',
              padding: '30px 34px',
              color: '#fff',
              boxShadow: '0 12px 34px rgba(255,77,94,.28)',
            }}
          >
            <div style={{ position: 'absolute', right: -30, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
            <div style={{ position: 'absolute', right: 90, bottom: -60, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
              <Icon name="sparkle" size={26} fill="#fff" stroke={0} />
              <h2 style={{ fontSize: 'clamp(22px,4vw,28px)', fontWeight: 800 }}>{bannerTitle}</h2>
            </div>
            <p style={{ marginTop: 6, fontSize: 15.5, color: 'rgba(255,255,255,.92)', position: 'relative' }}>{bannerSub}</p>
          </div>

          {/* chip categorie */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--s-6)' }}>
            <button
              onClick={() => setActiveCats([])}
              style={{
                padding: '8px 15px',
                borderRadius: 'var(--r-pill)',
                fontSize: 13.5,
                fontWeight: 700,
                border: '1px solid var(--border)',
                transition: 'all .16s var(--ease)',
                color: activeCats.length === 0 ? '#fff' : 'var(--ink-2)',
                background: activeCats.length === 0 ? 'var(--ink)' : 'var(--surface)',
              }}
            >
              Tutte
            </button>
            {CAT_ORDER.map((c) => {
              const on = activeCats.includes(c)
              const cc = CATEGORIES[c]
              return (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 15px',
                    borderRadius: 'var(--r-pill)',
                    fontSize: 13.5,
                    fontWeight: 700,
                    transition: 'all .16s var(--ease)',
                    border: `1px solid ${on ? 'transparent' : 'var(--border)'}`,
                    color: on ? '#fff' : cc.color,
                    background: on ? cc.color : 'var(--surface)',
                  }}
                >
                  <Icon name={cc.icon} size={15} stroke={2} />
                  {cc.label}
                </button>
              )
            })}
          </div>

          {/* stati speciali tab seguiti */}
          {tab === 'seguiti' && !token ? (
            <FollowGate
              icon="user"
              title="Per vedere i contenuti dei seguiti devi accedere"
              text="Accedi o registrati per seguire altri utenti e vedere le loro proposte qui."
              actions={
                <>
                  <Button onClick={() => navigate('/login')}>Accedi</Button>
                  <Button variant="ghost" onClick={() => navigate('/addUser')}>
                    Registrati
                  </Button>
                </>
              }
            />
          ) : tab === 'seguiti' && isOperatore ? (
            <FollowGate
              icon="tool"
              title="Funzione non disponibile per operatori"
              text="Gli operatori non possono seguire altri utenti."
              actions={<Button variant="ghost" onClick={() => setTab('esplora')}>Torna a Esplora</Button>}
            />
          ) : tab === 'seguiti' && seguiti === null ? (
            <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--ink-3)' }}>Caricamento…</div>
          ) : list.length === 0 ? (
            <EmptyState query="" emptyTab={tab} onReset={() => setActiveCats([])} />
          ) : (
            <Grid>
              {list.map((p, i) => (
                <ProposalCard
                  key={p._id}
                  proposta={p}
                  count={getCount(p)}
                  hyped={getActive(p)}
                  onHype={() => onHype(p)}
                  onOpen={() => navigate(`/proposte/${p._id}`)}
                  hypeDisabled={!canHype}
                  rank={tab === 'classifica' ? i + 1 : undefined}
                />
              ))}
            </Grid>
          )}
        </>
      )}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--s-5)', gridTemplateColumns: 'repeat(auto-fill, minmax(258px, 1fr))' }}>
      {children}
    </div>
  )
}

function EmptyState({ query, emptyTab, onReset }: { query: string; emptyTab?: Tab; onReset?: () => void }) {
  const title =
    emptyTab === 'seguiti' ? 'Nessuna proposta dai tuoi seguiti' : 'Nessuna proposta trovata'
  return (
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
        <Icon name="search" size={30} />
      </div>
      <h3 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 14.5 }}>
        {query ? `Nessun risultato per “${query}”.` : 'Prova a cambiare i filtri.'}
      </p>
      {onReset && (
        <div style={{ marginTop: 14, display: 'inline-flex' }}>
          <Button variant="ghost" onClick={onReset}>
            Reimposta filtri
          </Button>
        </div>
      )}
    </div>
  )
}

function FollowGate({
  icon,
  title,
  text,
  actions,
}: {
  icon: string
  title: string
  text: string
  actions: React.ReactNode
}) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-3)' }}>
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
        <Icon name={icon} size={30} />
      </div>
      <h3 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 14.5, marginBottom: 18 }}>{text}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>{actions}</div>
    </div>
  )
}

function UserGrid({ users, onOpen }: { users: IUser[]; onOpen: (id: string) => void }) {
  if (users.length === 0) return <EmptyState query="" />
  return (
    <div style={{ display: 'grid', gap: 'var(--s-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
      {users.map((u) => {
        const type = u.user_type ?? u.userType
        return (
          <Card key={u._id} hover onClick={() => onOpen(u._id)} pad="18px">
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <Avatar user={u} fetchAvatar size={48} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15.5,
                    color: 'var(--ink)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {UserService.getFullName(u)}
                </div>
                <div style={{ marginTop: 5 }}>
                  <RoleBadge type={type} />
                </div>
              </div>
            </div>
            {u.biografia && (
              <p
                style={{
                  marginTop: 12,
                  fontSize: 13.5,
                  color: 'var(--ink-2)',
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
          </Card>
        )
      })}
    </div>
  )
}
