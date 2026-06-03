import { useEffect, useMemo, useState } from 'react'
import { useUserStore } from '@/stores/userStore'
import { getAllOperatori, createOperatoreAdmin, deleteOperatore } from '@/api/operatoreApi'
import { getPasswordChecks } from '@/utils/passwordValidator'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { Badge, Button, Card, Icon, SectionTitle } from '@/components/ui'

interface Operatore {
  _id: string
  nome: string
  cognome: string
  credenziali?: { email?: string }
}

type Form = { nome: string; cognome: string; email: string; password: string }

const SECURITY_ENABLED = import.meta.env.VITE_ENABLE_SECURITY_CONTROLS === 'true'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const STRENGTH_COLOR: Record<string, string> = {
  weak: 'var(--brand)',
  medium: 'var(--cat-mostre)',
  good: 'var(--cat-workshop)',
  strong: 'var(--cat-sport)',
}
const STRENGTH_TEXT: Record<string, string> = {
  weak: 'Password debole',
  medium: 'Password media',
  good: 'Password buona',
  strong: 'Password sicura',
}

function initials(o: Operatore): string {
  return ((o.nome?.charAt(0) || '') + (o.cognome?.charAt(0) || '')).toUpperCase() || '?'
}

export default function AdminOperatori() {
  const token = useUserStore((s) => s.token)
  const mobile = useIsMobile()

  const [operatori, setOperatori] = useState<Operatore[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const [form, setForm] = useState<Form>({ nome: '', cognome: '', email: '', password: '' })
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const fetchOperatori = async () => {
    try {
      const data = await getAllOperatori(token)
      setOperatori(Array.isArray(data) ? data : (data?.operatori ?? []))
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Errore nel caricamento degli operatori')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    getAllOperatori(token)
      .then((data) => {
        if (!cancelled) setOperatori(Array.isArray(data) ? data : (data?.operatori ?? []))
      })
      .catch((err) => {
        if (!cancelled) setErrorMessage(err instanceof Error ? err.message : 'Errore nel caricamento degli operatori')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  /* ---- validazione (allineata ad AdminOperatoriView.vue) ---- */
  const isValidEmail = useMemo(() => EMAIL_RE.test(form.email), [form.email])
  const checks = useMemo(() => getPasswordChecks(form.password || ''), [form.password])
  const score = useMemo(() => Object.values(checks).filter(Boolean).length, [checks])
  const strength = score <= 2 ? 'weak' : score <= 3 ? 'medium' : score <= 4 ? 'good' : 'strong'
  const isValidPassword = SECURITY_ENABLED
    ? checks.length && checks.lowercase && checks.uppercase && checks.number && checks.special
    : !!form.password && form.password.length >= 6

  const create = async () => {
    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')
    setShowErrors(true)
    try {
      if (!form.nome.trim() || !form.cognome.trim() || !form.email.trim() || !form.password) {
        setErrorMessage('Tutti i campi sono obbligatori')
        return
      }
      if (!isValidEmail) {
        setErrorMessage('Inserisci un indirizzo email valido')
        return
      }
      if (SECURITY_ENABLED && !isValidPassword) {
        setErrorMessage('La password non soddisfa i requisiti di sicurezza')
        return
      }
      if (!SECURITY_ENABLED && form.password.length < 6) {
        setErrorMessage('La password deve essere di almeno 6 caratteri')
        return
      }

      await createOperatoreAdmin(form, token)
      setSuccessMessage(`Operatore ${form.nome} ${form.cognome} creato con successo!`)
      setForm({ nome: '', cognome: '', email: '', password: '' })
      setShowErrors(false)
      window.setTimeout(() => setSuccessMessage(''), 3000)
      fetchOperatori()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Errore nella creazione dell'operatore")
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (id: string) => {
    setErrorMessage('')
    setConfirmId(null)
    try {
      await deleteOperatore(id, token)
      setSuccessMessage('Operatore rimosso con successo!')
      window.setTimeout(() => setSuccessMessage(''), 3000)
      fetchOperatori()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Errore nella rimozione dell'operatore")
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(16px,3vw,28px) clamp(14px,4vw,28px) 80px', display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
      {/* hero */}
      <div
        className="fade-in"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--r-lg)',
          background: 'linear-gradient(110deg, var(--brand) 0%, var(--brand-700) 55%, #3a2a24 100%)',
          color: '#fff',
          padding: mobile ? '24px 22px' : '32px 36px',
        }}
      >
        <div style={{ position: 'absolute', right: -30, top: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div style={{ width: 50, height: 50, borderRadius: 15, background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center' }}>
            <Icon name="shield" size={26} stroke={2} />
          </div>
          <div>
            <h1 style={{ fontSize: mobile ? 24 : 30, fontWeight: 800 }}>Gestione Operatori</h1>
            <p style={{ color: 'rgba(255,255,255,.85)', marginTop: 4 }}>Amministra gli operatori del sistema</p>
          </div>
          <span style={{ flex: 1 }} />
          {!mobile && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36 }}>{operatori.length}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>Operatori attivi</div>
            </div>
          )}
        </div>
      </div>

      {/* form aggiunta */}
      <Card pad="clamp(20px,3vw,28px)">
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18, color: 'var(--ink)' }}>Aggiungi nuovo operatore</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!submitting) create()
          }}
        >
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: mobile ? '1fr' : '1fr 1fr' }}>
            <div>
              <label className="ic-label">Nome *</label>
              <input
                className="ic-input"
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                placeholder="Nome operatore"
                style={fieldErrStyle(showErrors && !form.nome.trim())}
              />
              {showErrors && !form.nome.trim() && <FieldError>Il nome è obbligatorio</FieldError>}
            </div>
            <div>
              <label className="ic-label">Cognome *</label>
              <input
                className="ic-input"
                value={form.cognome}
                onChange={(e) => set('cognome', e.target.value)}
                placeholder="Cognome operatore"
                style={fieldErrStyle(showErrors && !form.cognome.trim())}
              />
              {showErrors && !form.cognome.trim() && <FieldError>Il cognome è obbligatorio</FieldError>}
            </div>
            <div>
              <label className="ic-label">Email *</label>
              <input
                className="ic-input"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="email@esempio.com"
                style={fieldErrStyle(showErrors && (!form.email.trim() || !isValidEmail))}
              />
              {showErrors && !form.email.trim() ? (
                <FieldError>L'email è obbligatoria</FieldError>
              ) : showErrors && !isValidEmail ? (
                <FieldError>Formato email non valido</FieldError>
              ) : null}
            </div>
            <div>
              <label className="ic-label">Password *</label>
              <input
                className="ic-input"
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Password sicura"
                style={fieldErrStyle(showErrors && (!form.password || !isValidPassword))}
              />

              {SECURITY_ENABLED && form.password && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(score / 5) * 100}%`, background: STRENGTH_COLOR[strength], transition: 'all .3s var(--ease)' }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, marginTop: 5, color: STRENGTH_COLOR[strength] }}>{STRENGTH_TEXT[strength]}</p>
                </div>
              )}

              {SECURITY_ENABLED && (form.password || showErrors) && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <Requirement met={checks.length}>Almeno 8 caratteri</Requirement>
                  <Requirement met={checks.lowercase}>Una lettera minuscola</Requirement>
                  <Requirement met={checks.uppercase}>Una lettera maiuscola</Requirement>
                  <Requirement met={checks.number}>Un numero</Requirement>
                  <Requirement met={checks.special}>Un carattere speciale (!@#$%^&amp;*)</Requirement>
                </div>
              )}

              {showErrors && !form.password ? (
                <FieldError>La password è obbligatoria</FieldError>
              ) : showErrors && !isValidPassword ? (
                <FieldError>La password non soddisfa i requisiti di sicurezza</FieldError>
              ) : null}
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <Button type="submit" icon="plus" disabled={submitting}>
              {submitting ? 'Aggiunta…' : 'Aggiungi operatore'}
            </Button>
          </div>
        </form>

        {errorMessage && (
          <div style={msgStyle('var(--brand-700)', 'var(--brand-soft)', 'var(--brand)')}>{errorMessage}</div>
        )}
        {successMessage && (
          <div style={msgStyle('var(--cat-sport)', 'var(--cat-sport-soft)', 'var(--cat-sport)')}>{successMessage}</div>
        )}
      </Card>

      {/* lista operatori */}
      <div>
        <SectionTitle>Operatori attivi</SectionTitle>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--ink-3)' }}>Caricamento operatori…</div>
        ) : operatori.length === 0 ? (
          <Card pad="48px 24px" style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-3)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
              <Icon name="users" size={30} />
            </div>
            <h3 style={{ fontSize: 20, color: 'var(--ink)' }}>Nessun operatore</h3>
            <p style={{ color: 'var(--ink-3)', marginTop: 6 }}>Aggiungi il primo operatore utilizzando il form sopra.</p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--s-4)', gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {operatori.map((o) => (
              <Card key={o._id} pad="16px" className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                  {initials(o)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ink)' }}>
                    {o.nome} {o.cognome}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {o.credenziali?.email ?? ''}
                  </div>
                  <Badge color="var(--ink-2)" bg="var(--surface-3)" icon="tool" style={{ marginTop: 6 }}>
                    Operatore
                  </Badge>
                </div>
                {confirmId === o._id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <Button variant="danger" icon="trash" size="sm" onClick={() => remove(o._id)}>
                      Conferma
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                      Annulla
                    </Button>
                  </div>
                ) : (
                  <Button variant="danger" icon="trash" size="sm" onClick={() => setConfirmId(o._id)}>
                    Rimuovi
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function fieldErrStyle(err: boolean) {
  return err ? { borderColor: 'var(--brand)', boxShadow: '0 0 0 4px var(--brand-soft)' } : undefined
}

function msgStyle(color: string, bg: string, border: string) {
  return {
    background: bg,
    color,
    border: `1px solid ${border}`,
    borderRadius: 'var(--r-md)',
    padding: '12px 16px',
    marginTop: 16,
    fontSize: 14,
    fontWeight: 600,
  } as const
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <div style={{ color: 'var(--brand-700)', fontSize: 13, marginTop: 6 }}>{children}</div>
}

function Requirement({ met, children }: { met: boolean; children: React.ReactNode }) {
  const color = met ? 'var(--cat-sport)' : 'var(--ink-3)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color }}>
      <Icon name={met ? 'check' : 'x'} size={14} stroke={2.4} />
      {children}
    </div>
  )
}
