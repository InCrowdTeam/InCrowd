import { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import { login } from '@/api/authApi'
import { createUserWithFormData } from '@/api/userApi'
import { Card, Button, Icon } from '@/components/ui'

type AccountType = 'privato' | 'ente'

interface GoogleSignupState {
  nome?: string
  cognome?: string
  email?: string
  oauthCode?: string
  type?: AccountType
  /** JSON serializzato dell'allegato foto profilo proveniente da Google. */
  fotoProfilo?: string
}

const STEPS: Array<{ label: string; status: 'completed' | 'active' }> = [
  { label: 'Tipo Account', status: 'completed' },
  { label: 'Google Login', status: 'completed' },
  { label: 'Dettagli', status: 'active' },
]

export default function CompleteGoogleSignup() {
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useUserStore((s) => s.setUser)
  const setToken = useUserStore((s) => s.setToken)
  const setUserType = useUserStore((s) => s.setUserType)

  const state = (location.state as GoogleSignupState | null) || null

  // Senza dati Google nello state non possiamo completare: torna alla registrazione.
  // (Il guard viene applicato dopo gli hook per rispettare le rules-of-hooks.)
  const valid = !!state && !!state.oauthCode && !!state.email

  const type: AccountType = state?.type === 'ente' ? 'ente' : 'privato'
  const showCognome = type === 'privato'

  // nome/cognome importati da Google (eventualmente splittati come nel Vue)
  const nomeGoogle = useMemo(() => {
    const n = state?.nome || ''
    // Split nome/cognome solo per privati: per gli enti il nome (anche con spazi) resta intero.
    return state?.type !== 'ente' && n.includes(' ') ? n.split(' ')[0] : n
  }, [state?.nome, state?.type])
  const cognomeGoogle = useMemo(() => {
    const n = state?.nome || ''
    const c = state?.cognome || ''
    if (c) return c
    if (state?.type !== 'ente' && n.includes(' ')) return n.split(' ').slice(1).join(' ')
    return ''
  }, [state?.nome, state?.cognome, state?.type])

  // Foto profilo importata da Google (allegato JSON nello state) — derivata, non in un effetto.
  const fotoProfiloRaw = state?.fotoProfilo
  const googlePhoto = useMemo(() => {
    if (fotoProfiloRaw && fotoProfiloRaw !== 'undefined') {
      try {
        const fotoData = JSON.parse(fotoProfiloRaw) as { data?: string; contentType?: string }
        if (fotoData?.data) return `data:${fotoData.contentType || 'image/jpeg'};base64,${fotoData.data}`
      } catch {
        // ignora foto Google malformata
      }
    }
    return ''
  }, [fotoProfiloRaw])

  const [nome, setNome] = useState(nomeGoogle)
  const [cognome, setCognome] = useState(cognomeGoogle)
  const [codiceFiscale, setCodiceFiscale] = useState('')
  const [biografia, setBiografia] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState(googlePhoto)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const canProceed = useMemo(() => {
    const base = !!nome && !!codiceFiscale
    if (showCognome) return base && !!cognome
    return base
  }, [nome, codiceFiscale, showCognome, cognome])

  const triggerFileInput = () => fileInputRef.current?.click()
  const removePhoto = () => {
    setFoto(null)
    setPreviewUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFoto(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewUrl((ev.target?.result as string) ?? '')
    reader.readAsDataURL(file)
  }

  const goBack = () => navigate('/addUser')

  const navigateByRole = (userType: string) => {
    if (userType === 'admin') navigate('/admin/operatori')
    else if (userType === 'operatore') navigate('/pannello-operatore')
    else navigate('/')
  }

  /* ---- submit (porting handleSignUp) ---- */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state) return
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    const userEmail = state.email || ''
    const oauthCode = state.oauthCode || ''

    try {
      const formData = new FormData()
      formData.append('nome', nome.trim())
      if (showCognome) formData.append('cognome', cognome.trim())
      formData.append('codiceFiscale', codiceFiscale.trim())
      formData.append('biografia', biografia.trim())

      // Foto: nuova caricata oppure quella di Google
      if (foto) {
        formData.append('fotoProfilo', foto)
      } else if (state.fotoProfilo && state.fotoProfilo !== 'undefined') {
        formData.append('fotoProfiloGoogle', state.fotoProfilo)
      }

      formData.append('user_type', showCognome ? 'privato' : 'ente')
      formData.append('email', userEmail)
      // Solo oauthCode, mai password per Google
      formData.append('oauthCode', oauthCode)

      await createUserWithFormData(formData)

      setSuccessMessage('Registrazione completata! Accesso in corso…')

      // Login automatico con oauthCode
      try {
        const loginData = await login({ email: userEmail, oauthCode })
        setUser(loginData.data.user)
        setToken(loginData.data.token)
        setUserType(loginData.data.userType)
        setTimeout(() => navigateByRole(loginData.data.userType), 1200)
      } catch {
        setTimeout(() => navigate('/login'), 1200)
      }
    } catch (err) {
      setErrorMessage(
        (err as Error)?.message || 'Errore di connessione. Verifica la tua connessione internet.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Guard dopo gli hook: nessun dato Google → torna alla registrazione.
  if (!valid) return <Navigate to="/addUser" replace />

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(24px,5vw,52px) clamp(14px,4vw,28px) 80px' }}>
      {/* Header + progress */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--s-6)' }}>
        <h1 style={{ fontSize: 'clamp(24px,5vw,30px)', fontWeight: 800, color: 'var(--ink)' }}>
          Unisciti a InCrowd
        </h1>
        <p style={{ marginTop: 8, fontSize: 14.5, color: 'var(--ink-2)' }}>
          Crea il tuo account in pochi semplici passi
        </p>
        <Stepper />
      </div>

      <Card className="fade-in" pad="0" style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        {/* Foto da Google */}
        {googlePhoto && (
          <div
            style={{
              textAlign: 'center',
              margin: 'clamp(22px,4vw,32px) clamp(22px,4vw,32px) 0',
              padding: 20,
              borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
              <img
                src={googlePhoto}
                alt="Foto profilo"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--brand)',
                  display: 'block',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  background: 'var(--brand)',
                  color: '#fff',
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 'var(--r-pill)',
                }}
              >
                Da Google
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', fontStyle: 'italic' }}>
              Foto profilo importata dal tuo account Google
            </p>
          </div>
        )}

        {errorMessage && <Banner text={errorMessage} kind="error" />}
        {successMessage && <Banner text={successMessage} kind="success" />}

        <form onSubmit={handleSignUp}>
          <div style={{ padding: 'clamp(22px,4vw,32px)' }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', textAlign: 'center', marginBottom: 'var(--s-5)' }}>
              Completa il tuo profilo
            </h2>

            {/* Tipo account selezionato */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--s-5)' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '9px 18px',
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--ink)',
                }}
              >
                <Icon name={type === 'privato' ? 'user' : 'building'} size={17} />
                {type === 'privato' ? 'Utente Privato' : 'Ente/Organizzazione'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'var(--s-5)' }}>
              {/* colonna 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
                <Field label={type === 'ente' ? "Nome dell'Ente" : 'Nome'} icon={type === 'ente' ? 'building' : 'user'} required>
                  <input
                    className="ic-input"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder={type === 'ente' ? 'Es: Comune di Milano' : 'Es: Mario'}
                    disabled={!!nomeGoogle}
                    style={nomeGoogle ? { opacity: 0.7, cursor: 'not-allowed' } : undefined}
                  />
                  {!!nomeGoogle && <InputNote>Importato da Google</InputNote>}
                </Field>

                {showCognome && (
                  <Field label="Cognome" icon="user" required>
                    <input
                      className="ic-input"
                      value={cognome}
                      onChange={(e) => setCognome(e.target.value)}
                      placeholder="Es: Rossi"
                      disabled={!!cognomeGoogle}
                      style={cognomeGoogle ? { opacity: 0.7, cursor: 'not-allowed' } : undefined}
                    />
                    {!!cognomeGoogle && <InputNote>Importato da Google</InputNote>}
                  </Field>
                )}

                <Field label="Codice Fiscale" icon="shield" required>
                  <input
                    className="ic-input"
                    value={codiceFiscale}
                    onChange={(e) => setCodiceFiscale(e.target.value)}
                    placeholder="Es: RSSMRA80A01H501Z"
                  />
                </Field>
              </div>

              {/* colonna 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
                <Field label="Biografia (facoltativa)" icon="edit">
                  <textarea
                    className="ic-input"
                    value={biografia}
                    onChange={(e) => setBiografia(e.target.value)}
                    placeholder={type === 'ente' ? 'Descrivi la tua organizzazione…' : 'Raccontaci qualcosa di te…'}
                    style={{ minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </Field>

                <Field label="Foto Profilo (opzionale)" icon="camera">
                  <div
                    onClick={triggerFileInput}
                    style={{
                      border: '1.5px dashed var(--border)',
                      borderRadius: 'var(--r-sm)',
                      padding: 16,
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'var(--surface-2)',
                      transition: 'all .18s var(--ease)',
                    }}
                  >
                    {!foto && !previewUrl ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--ink-3)' }}>
                        <Icon name="image" size={26} />
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>
                          Clicca per selezionare
                        </span>
                      </div>
                    ) : (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={previewUrl}
                          alt="Anteprima"
                          style={{ maxWidth: 90, maxHeight: 90, borderRadius: 'var(--r-sm)', display: 'block' }}
                        />
                        {foto && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removePhoto()
                            }}
                            style={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              border: 'none',
                              background: 'var(--brand)',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            <Icon name="x" size={13} stroke={2.5} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* navigazione */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              padding: 'clamp(16px,3vw,22px) clamp(22px,4vw,32px)',
              background: 'var(--surface-2)',
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}
          >
            <Button variant="ghost" icon="arrowleft" onClick={goBack}>
              Indietro
            </Button>
            <Button type="submit" variant="success" icon="check" disabled={isSubmitting || !canProceed}>
              {isSubmitting ? 'Creazione in corso…' : 'Crea Account'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

/* ---------------- sub-componenti locali ---------------- */

function Stepper() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 'clamp(20px,5vw,40px)', marginTop: 'var(--s-6)' }}>
      {STEPS.map((step, i) => {
        const active = step.status === 'active'
        const completed = step.status === 'completed'
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: 15,
                transition: 'all .3s var(--ease)',
                background: active ? 'var(--brand)' : completed ? 'var(--ink)' : 'var(--surface-3)',
                color: active || completed ? '#fff' : 'var(--ink-3)',
                transform: active ? 'scale(1.05)' : 'none',
                boxShadow: active ? '0 6px 16px rgba(255,77,94,.35)' : 'none',
              }}
            >
              {completed ? <Icon name="check" size={18} stroke={2.5} /> : i + 1}
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: active ? 700 : 600,
                color: active ? 'var(--brand-700)' : 'var(--ink-3)',
                textAlign: 'center',
              }}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Field({
  label,
  icon,
  required,
  children,
}: {
  label: string
  icon: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="ic-label">
        <Icon name={icon} size={15} />
        {label}
        {required && <span style={{ color: 'var(--brand)', fontWeight: 800 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function InputNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 5, fontSize: 12, fontStyle: 'italic', color: 'var(--ink-3)' }}>{children}</div>
  )
}

function Banner({ text, kind }: { text: string; kind: 'error' | 'success' }) {
  const isError = kind === 'error'
  return (
    <div
      style={{
        margin: 'clamp(16px,3vw,22px) clamp(22px,4vw,32px) 0',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '12px 14px',
        borderRadius: 'var(--r-sm)',
        background: isError ? 'var(--brand-soft)' : 'var(--cat-sport-soft)',
        color: isError ? 'var(--brand-700)' : 'var(--cat-sport)',
        fontSize: 13.5,
        fontWeight: 600,
      }}
    >
      <Icon name={isError ? 'x' : 'check'} size={17} />
      {text}
    </div>
  )
}
