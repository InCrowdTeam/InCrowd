import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUltimiCommenti } from '@/api/commentiApi'
import { deleteCommento } from '@/api/propostaApi'
import { useUserStore } from '@/stores/userStore'
import { UserService } from '@/services/UserService'
import { DateService } from '@/services/DateService'
import type { IUser } from '@/types/User'
import { Avatar, Button, Card, Icon, SectionTitle } from '@/components/ui'

/** Forma del commento restituita da GET /api/proposte/commenti (vedi propostaController.getUltimiCommenti). */
interface CommentoGlobale {
  _id: string
  contenuto: string
  dataOra?: string
  utente?: { _id: string; nome?: string; cognome?: string }
  proposta?: { _id: string; titolo?: string }
}

export default function UltimiCommenti() {
  const navigate = useNavigate()
  const token = useUserStore((s) => s.token)

  const [commenti, setCommenti] = useState<CommentoGlobale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const carica = async () => {
    try {
      const data = await getUltimiCommenti()
      setCommenti(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Errore caricamento commenti:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei commenti')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    getUltimiCommenti()
      .then((data) => {
        if (!cancelled) setCommenti(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Errore caricamento commenti:', err)
        setError(err instanceof Error ? err.message : 'Errore nel caricamento dei commenti')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (!search) return commenti
    const s = search.toLowerCase()
    return commenti.filter(
      (c) =>
        c.contenuto?.toLowerCase().includes(s) ||
        c.utente?.nome?.toLowerCase().includes(s) ||
        c.proposta?.titolo?.toLowerCase().includes(s),
    )
  }, [commenti, search])

  const elimina = async (c: CommentoGlobale) => {
    setConfirmId(null)
    if (!c.proposta?._id) return
    try {
      await deleteCommento(c.proposta._id, c._id, token)
      setCommenti((prev) => prev.filter((x) => x._id !== c._id))
    } catch (err) {
      console.error('Errore eliminazione commento:', err)
      setError(err instanceof Error ? err.message : 'Errore nella cancellazione del commento')
    }
  }

  return (
    <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: 'clamp(16px,3vw,28px) clamp(14px,4vw,28px) 80px' }}>
      <SectionTitle sub="Visualizza e modera tutti i commenti inseriti dagli utenti su ogni proposta">
        Tutti i commenti
      </SectionTitle>

      {/* ricerca */}
      <Card pad="16px" style={{ marginBottom: 'var(--s-5)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Icon name="search" size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }} />
          <input
            className="ic-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca commenti per contenuto, utente o proposta…"
            style={{ paddingLeft: 42, borderRadius: 'var(--r-pill)' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', display: 'grid', placeItems: 'center' }}
              aria-label="Pulisci ricerca"
            >
              <Icon name="x" size={18} />
            </button>
          )}
        </div>
      </Card>

      {/* stati */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--ink-3)' }}>Caricamento commenti…</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-3)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface-3)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <Icon name="x" size={30} />
          </div>
          <h3 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>Errore nel caricamento</h3>
          <p style={{ fontSize: 14.5, marginBottom: 18 }}>{error}</p>
          <div style={{ display: 'inline-flex' }}>
            <Button
              onClick={() => {
                setLoading(true)
                setError('')
                carica()
              }}
            >
              Riprova
            </Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--ink-3)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface-3)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <Icon name="comment" size={30} />
          </div>
          <h3 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>
            {search ? 'Nessun commento trovato' : 'Nessun commento presente'}
          </h3>
          <p style={{ fontSize: 14.5 }}>
            {search ? 'Prova a modificare i criteri di ricerca.' : 'Non è ancora stato inserito alcun commento sulle proposte.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--s-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {filtered.map((c) => {
            const author: IUser | null = c.utente?._id
              ? ({ _id: c.utente._id, nome: c.utente.nome ?? 'Utente', cognome: c.utente.cognome } as IUser)
              : null
            return (
              <Card key={c._id} pad="0" className="fade-in" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  {/* header: utente + data + elimina */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <Avatar user={author} fetchAvatar={!!author} size={38} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {author ? UserService.getFullName(author) : 'Utente'}
                      </div>
                      {c.dataOra && (
                        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
                          {DateService.formatRelativeDate(c.dataOra)}
                        </div>
                      )}
                    </div>
                    {confirmId === c._id ? (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <Button variant="danger" icon="trash" size="sm" onClick={() => elimina(c)}>
                          Conferma
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                          Annulla
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(c._id)}
                        title="Elimina commento"
                        style={{
                          flexShrink: 0,
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--r-sm)',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'var(--brand-700)',
                          background: 'var(--brand-soft)',
                          transition: 'all .16s var(--ease)',
                        }}
                        aria-label="Elimina commento"
                      >
                        <Icon name="trash" size={16} stroke={2} />
                      </button>
                    )}
                  </div>

                  {/* contenuto */}
                  <p style={{ fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.5 }}>{c.contenuto}</p>

                  <div style={{ flex: 1 }} />
                  <div style={{ height: 1, background: 'var(--border)' }} />

                  {/* link proposta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink-3)' }}>
                    <Icon name="sparkle" size={14} />
                    <span style={{ fontWeight: 600 }}>Proposta:</span>
                    {c.proposta?._id ? (
                      <button
                        onClick={() => navigate(`/proposte/${c.proposta!._id}`)}
                        style={{
                          color: 'var(--brand-700)',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                        }}
                      >
                        {c.proposta.titolo || 'Apri proposta'}
                      </button>
                    ) : (
                      <span style={{ fontStyle: 'italic' }}>Sconosciuta</span>
                    )}
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
