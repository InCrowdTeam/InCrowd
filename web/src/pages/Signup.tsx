import { useMemo, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import { googleLogin as googleLoginApi } from '@/api/authApi'
import { createUserWithFormData } from '@/api/userApi'
import { useGoogleSignIn, isGoogleConfigured } from '@/lib/googleSignin'
import {
  validatePassword,
  getPasswordChecks,
  getPasswordStrengthText,
  areSecurityControlsEnabled,
} from '@/utils/passwordValidator'
import { Card, Button, Icon } from '@/components/ui'

type AccountType = 'privato' | 'ente'

/** Payload di registrazione restituito da /auth/google quando needsRegistration. */
interface GoogleRegData {
  nome?: string
  cognome?: string
  email?: string
  oauthCode?: string
  fotoProfilo?: unknown
}

const STEPS = [
  { label: 'Tipo Account' },
  { label: 'Metodo' },
  { label: 'Dettagli' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CF_RE = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/

/* Colore barra forza password coerente con i 4 livelli del validator. */
const STRENGTH_COLOR: Record<string, string> = {
  weak: '#dc2626',
  medium: '#f59e0b',
  good: '#3b82f6',
  strong: 'var(--cat-sport)',
}

export default function Signup() {
  const navigate = useNavigate()
  const setUser = useUserStore((s) => s.setUser)
  const setToken = useUserStore((s) => s.setToken)
  const setUserType = useUserStore((s) => s.setUserType)

  const [currentStep, setCurrentStep] = useState(1)
  const [type, setType] = useState<AccountType | ''>('')
  const [isEmailSignup, setIsEmailSignup] = useState(false)
  const [googleSignInCompleted, setGoogleSignInCompleted] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [codiceFiscale, setCodiceFiscale] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [biografia, setBiografia] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const securityEnabled = areSecurityControlsEnabled()

  /* ---- validazioni (porting da SignupView.vue) ---- */
  const isValidEmail = useMemo(() => EMAIL_RE.test(email), [email])
  const isValidCodiceFiscale = useMemo(() => CF_RE.test(codiceFiscale.toUpperCase()), [codiceFiscale])

  const checks = useMemo(() => getPasswordChecks(password), [password])
  const passwordResult = useMemo(() => validatePassword(password), [password])
  const isValidPassword = useMemo(() => {
    if (!securityEnabled) return !!password && password.length >= 6
    return checks.length && checks.lowercase && checks.uppercase && checks.number && checks.special
  }, [securityEnabled, password, checks])

  const authMethodChosen = isEmailSignup || googleSignInCompleted

  const canProceedStep3 = useMemo(() => {
    const baseFields =
      !!nome && !!codiceFiscale && !!email && !!password && isValidEmail && isValidPassword
    if (type === 'privato') return baseFields && !!cognome && isValidCodiceFiscale
    return baseFields
  }, [nome, codiceFiscale, email, password, isValidEmail, isValidPassword, type, cognome, isValidCodiceFiscale])

  /* ---- navigazione wizard ---- */
  const selectAccountType = (t: AccountType) => {
    setType(t)
    setMessage('')
  }
  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length))
  const previousStep = () => setCurrentStep((s) => Math.max(s - 1, 1))
  const chooseEmailSignup = () => {
    setIsEmailSignup(true)
    setCurrentStep(3)
  }

  /* ---- foto profilo ---- */
  const triggerFileInput = () => fileInputRef.current?.click()
  const removePhoto = () => {
    setFoto(null)
    setFotoPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFoto(file)
    const reader = new FileReader()
    reader.onload = (ev) => setFotoPreview((ev.target?.result as string) ?? '')
    reader.readAsDataURL(file)
  }

  /* ---- submit (porting handleSignUp) ---- */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    setShowErrors(true)

    if (!canProceedStep3) {
      setMessage(
        'Compila correttamente tutti i campi obbligatori: nome, codice fiscale, email e una password valida.',
      )
      setIsSubmitting(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('nome', nome)
      if (type === 'privato') formData.append('cognome', cognome)
      formData.append('codiceFiscale', codiceFiscale)
      formData.append('biografia', biografia)
      if (foto) formData.append('fotoProfilo', foto)
      formData.append('email', email)
      formData.append('password', password)
      formData.append('user_type', type === 'ente' ? 'ente' : 'privato')

      const responseData = await createUserWithFormData(formData)
      const data = responseData.data as { token?: string; user?: any; userType?: string }

      if (data && data.token && data.user) {
        // Login automatico
        setToken(data.token)
        setUser(data.user)
        if (data.userType) setUserType(data.userType)
        navigate('/')
      } else {
        // Fallback: vai al login
        navigate('/login')
      }
    } catch (error) {
      setMessage(`Errore durante la registrazione: ${(error as Error)?.message || 'Errore generico'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ---- Google sign-up (porting handleGoogle/redirectToCompleteSignup) ---- */
  const redirectToCompleteSignup = (data: GoogleRegData, idToken: string) => {
    let n = data.nome || ''
    let c = data.cognome || ''
    const accountType = type || 'privato'

    if (accountType === 'privato') {
      if (!c && n.includes(' ')) {
        const parts = n.split(' ')
        n = parts[0]
        c = parts.slice(1).join(' ')
      }
    } else {
      if (c) {
        n = `${n} ${c}`
        c = ''
      }
    }

    navigate('/completeGoogleSignup', {
      state: {
        nome: n,
        cognome: c,
        email: data.email,
        oauthCode: data.oauthCode || idToken,
        type: accountType,
        fotoProfilo: data.fotoProfilo ? JSON.stringify(data.fotoProfilo) : undefined,
      },
    })
  }

  const handleGoogle = async (idToken: string) => {
    setMessage('')
    try {
      const res = await googleLoginApi({ idToken })
      if (res.needsRegistration) {
        setGoogleSignInCompleted(true)
        const regData = (res.data ?? {}) as GoogleRegData
        redirectToCompleteSignup(regData, idToken)
        return
      }
      // Account già esistente: login riuscito
      setUser(res.data.user)
      setToken(res.data.token)
      setUserType(res.data.userType)
      navigate('/')
    } catch (err) {
      setMessage((err as Error)?.message || 'Errore durante la registrazione con Google')
    }
  }

  const googleRef = useGoogleSignIn(handleGoogle, { text: 'signup_with' })
  const googleOn = isGoogleConfigured()

  /* ---------- render ---------- */
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
        <Stepper current={currentStep} />
      </div>

      <Card className="fade-in" pad="0" style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        <form onSubmit={handleSignUp}>
          {/* messaggio */}
          {message && <Banner text={message} />}

          {/* STEP 1: tipo account */}
          {currentStep === 1 && (
            <div style={{ padding: 'clamp(22px,4vw,32px)' }}>
              <StepHeader>Che tipo di account vuoi creare?</StepHeader>
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}
              >
                <AccountTypeCard
                  active={type === 'privato'}
                  icon="user"
                  title="Utente"
                  text="Partecipa agli eventi e crea proposte"
                  onClick={() => selectAccountType('privato')}
                />
                <AccountTypeCard
                  active={type === 'ente'}
                  icon="building"
                  title="Ente/Organizzazione"
                  text="Organizza eventi e gestisci proposte"
                  onClick={() => selectAccountType('ente')}
                />
              </div>
            </div>
          )}

          {/* STEP 2: metodo di registrazione */}
          {currentStep === 2 && (
            <div style={{ padding: 'clamp(22px,4vw,32px)' }}>
              <StepHeader>Come preferisci registrarti?</StepHeader>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
                  gap: 16,
                  alignItems: 'stretch',
                }}
              >
                {/* Google */}
                {googleOn && (
                  <div
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)',
                      padding: '22px 20px',
                      background: 'var(--surface-2)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                      <Icon name="sparkle" size={18} />
                      <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>Accesso con Google</h3>
                    </div>
                    <div ref={googleRef} style={{ display: 'flex', justifyContent: 'center' }} />
                  </div>
                )}

                {/* Email */}
                <div
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    padding: '22px 20px',
                    background: 'var(--surface-2)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                    <Icon name="mail" size={18} />
                    <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>Email e Password</h3>
                  </div>
                  <div style={{ marginTop: 'auto' }}>
                    <Button full size="lg" icon="arrowright" onClick={chooseEmailSignup}>
                      Continua con Email
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: dettagli */}
          {currentStep === 3 && (
            <div style={{ padding: 'clamp(22px,4vw,32px)' }}>
              <StepHeader>Completa il tuo profilo</StepHeader>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'var(--s-5)' }}>
                {/* colonna 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
                  <Field
                    label={type === 'ente' ? "Nome dell'Ente" : 'Nome'}
                    icon={type === 'ente' ? 'building' : 'user'}
                    required
                  >
                    <input
                      className="ic-input"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder={type === 'ente' ? 'Es: Comune di Milano' : 'Es: Mario'}
                    />
                    {showErrors && !nome.trim() && <FieldError>Il nome è obbligatorio</FieldError>}
                  </Field>

                  {type === 'privato' && (
                    <Field label="Cognome" icon="user" required>
                      <input
                        className="ic-input"
                        value={cognome}
                        onChange={(e) => setCognome(e.target.value)}
                        placeholder="Es: Rossi"
                      />
                      {showErrors && !cognome.trim() && <FieldError>Il cognome è obbligatorio</FieldError>}
                    </Field>
                  )}

                  <Field label="Codice Fiscale" icon="shield" required>
                    <input
                      className="ic-input"
                      value={codiceFiscale}
                      onChange={(e) => setCodiceFiscale(e.target.value)}
                      onBlur={() => setCodiceFiscale((v) => v.toUpperCase())}
                      placeholder={type === 'ente' ? 'Es: 12345678901 (P.IVA/CF)' : 'Es: RSSMRA80A01H501Z'}
                    />
                    {showErrors && !codiceFiscale.trim() ? (
                      <FieldError>Il codice fiscale è obbligatorio</FieldError>
                    ) : showErrors && type === 'privato' && !isValidCodiceFiscale ? (
                      <FieldError>Codice fiscale non valido</FieldError>
                    ) : null}
                  </Field>

                  <Field label="Email" icon="mail" required>
                    <input
                      type="email"
                      className="ic-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mario.rossi@example.com"
                    />
                    {showErrors && !email.trim() ? (
                      <FieldError>L'email è obbligatoria</FieldError>
                    ) : showErrors && !isValidEmail ? (
                      <FieldError>Formato email non valido</FieldError>
                    ) : null}
                  </Field>

                  <Field label="Password" icon="shield" required>
                    <input
                      type="password"
                      className="ic-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Scegli una password sicura"
                    />

                    {/* barra forza */}
                    {password && securityEnabled && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              borderRadius: 3,
                              width: `${passwordResult.percentage}%`,
                              background: STRENGTH_COLOR[passwordResult.strength],
                              transition: 'all .3s var(--ease)',
                            }}
                          />
                        </div>
                        <p
                          style={{
                            marginTop: 5,
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: STRENGTH_COLOR[passwordResult.strength],
                          }}
                        >
                          {getPasswordStrengthText(passwordResult.strength)}
                        </p>
                      </div>
                    )}

                    {/* requisiti */}
                    {(password || showErrors) && securityEnabled && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: '12px 14px',
                          borderRadius: 'var(--r-sm)',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <Requirement met={checks.length}>Almeno 8 caratteri</Requirement>
                        <Requirement met={checks.lowercase}>Una lettera minuscola</Requirement>
                        <Requirement met={checks.uppercase}>Una lettera maiuscola</Requirement>
                        <Requirement met={checks.number}>Un numero</Requirement>
                        <Requirement met={checks.special}>Un carattere speciale (!@#$%^&amp;*)</Requirement>
                      </div>
                    )}

                    {showErrors && !password ? (
                      <FieldError>La password è obbligatoria</FieldError>
                    ) : showErrors && !isValidPassword ? (
                      <FieldError>La password non soddisfa i requisiti di sicurezza</FieldError>
                    ) : null}
                  </Field>
                </div>

                {/* colonna 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
                  <Field label="Biografia (opzionale)" icon="edit">
                    <textarea
                      className="ic-input"
                      value={biografia}
                      onChange={(e) => setBiografia(e.target.value)}
                      placeholder={
                        type === 'ente' ? 'Descrivi la tua organizzazione…' : 'Raccontaci qualcosa di te…'
                      }
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
                      {!foto ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--ink-3)' }}>
                          <Icon name="image" size={26} />
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>
                            Clicca per selezionare
                          </span>
                        </div>
                      ) : (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={fotoPreview}
                            alt="Anteprima"
                            style={{ maxWidth: 90, maxHeight: 90, borderRadius: 'var(--r-sm)', display: 'block' }}
                          />
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
          )}

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
            {currentStep > 1 ? (
              <Button variant="ghost" icon="arrowleft" onClick={previousStep}>
                Indietro
              </Button>
            ) : (
              <span />
            )}

            {currentStep === 1 && (
              <Button iconRight="arrowright" disabled={!type} onClick={nextStep}>
                Continua
              </Button>
            )}
            {currentStep === 2 && (
              <Button iconRight="arrowright" disabled={!authMethodChosen} onClick={nextStep}>
                Continua
              </Button>
            )}
            {currentStep === 3 && (
              <Button
                type="submit"
                variant="success"
                icon="check"
                disabled={isSubmitting || !canProceedStep3}
              >
                {isSubmitting ? 'Creazione in corso…' : 'Crea Account'}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <p style={{ marginTop: 'var(--s-6)', textAlign: 'center', fontSize: 14, color: 'var(--ink-2)' }}>
        Hai già un account?{' '}
        <Link to="/login" style={{ color: 'var(--brand-700)', fontWeight: 700 }}>
          Accedi
        </Link>
      </p>
    </div>
  )
}

/* ---------------- sub-componenti locali ---------------- */

function Stepper({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 'clamp(20px,5vw,40px)', marginTop: 'var(--s-6)' }}>
      {STEPS.map((step, i) => {
        const n = i + 1
        const active = current === n
        const completed = current > n
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
              {completed ? <Icon name="check" size={18} stroke={2.5} /> : n}
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

function StepHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', textAlign: 'center', marginBottom: 'var(--s-5)' }}>
      {children}
    </h2>
  )
}

function AccountTypeCard({
  active,
  icon,
  title,
  text,
  onClick,
}: {
  active: boolean
  icon: string
  title: string
  text: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
        borderRadius: 'var(--r-md)',
        padding: 20,
        cursor: 'pointer',
        background: active ? 'var(--brand-soft)' : 'var(--surface-2)',
        transition: 'all .18s var(--ease)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--r-sm)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          background: active ? 'var(--brand)' : 'var(--surface-3)',
          color: active ? '#fff' : 'var(--ink-2)',
        }}
      >
        <Icon name={icon} size={24} />
      </div>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4 }}>{text}</p>
      </div>
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

function FieldError({ children }: { children: React.ReactNode }) {
  return <div style={{ marginTop: 5, fontSize: 12.5, fontWeight: 600, color: '#dc2626' }}>{children}</div>
}

function Requirement({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12.5,
        fontWeight: 600,
        color: met ? 'var(--cat-sport)' : 'var(--ink-3)',
      }}
    >
      <Icon name={met ? 'check' : 'x'} size={14} stroke={2.5} />
      {children}
    </div>
  )
}

function Banner({ text }: { text: string }) {
  const isError = text.startsWith('Errore')
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
