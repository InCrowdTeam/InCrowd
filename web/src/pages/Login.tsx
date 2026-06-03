import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import { login as loginApi, googleLogin as googleLoginApi } from '@/api/authApi'
import { useGoogleSignIn, isGoogleConfigured } from '@/lib/googleSignin'
import { Card, Button, Icon } from '@/components/ui'
import incrowdLogo from '@/assets/incrowd-logo.png'

export default function Login() {
  const navigate = useNavigate()
  const setUser = useUserStore((s) => s.setUser)
  const setToken = useUserStore((s) => s.setToken)
  const setUserType = useUserStore((s) => s.setUserType)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  /* Navigazione post-login in base al tipo utente (porting da LoginView.vue). */
  const navigateByRole = (userType: string) => {
    if (userType === 'admin') navigate('/admin/operatori')
    else if (userType === 'operatore') navigate('/pannello-operatore')
    else navigate('/')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)
    try {
      const res = await loginApi({ email, password })

      setToken(res.data.token)
      setUserType(res.data.userType)

      // Per l'admin creiamo un oggetto user specifico (come LoginView.vue)
      if (res.data.userType === 'admin') {
        setUser({ email, nome: 'Admin', cognome: 'Sistema' })
      } else {
        setUser(res.data.user)
      }

      navigateByRole(res.data.userType)
    } catch (err) {
      setErrorMessage((err as Error)?.message || 'Errore durante il login')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async (idToken: string) => {
    setErrorMessage('')
    try {
      const res = await googleLoginApi({ idToken })

      if (res.needsRegistration) {
        // Account non trovato: mostra errore, niente registrazione da qui.
        setErrorMessage('Account non trovato. Registrati prima di fare login.')
        return
      }

      setUser(res.data.user)
      setToken(res.data.token)
      setUserType(res.data.userType)

      navigateByRole(res.data.userType)
    } catch (err) {
      console.error('Errore Google login:', err)
      setErrorMessage((err as Error)?.message || 'Errore durante il login con Google')
    }
  }

  const googleRef = useGoogleSignIn(handleGoogle, { text: 'continue_with' })
  const googleOn = isGoogleConfigured()

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: 'clamp(28px,6vw,64px) clamp(14px,4vw,28px) 80px',
      }}
    >
      <Card className="fade-in" pad="clamp(26px,4vw,38px)" style={{ borderRadius: 'var(--r-lg)' }}>
        {/* Header con brand mark */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--s-6)' }}>
          <img
            src={incrowdLogo}
            alt="InCrowd"
            width={60}
            height={60}
            style={{ display: 'block', margin: '0 auto 16px' }}
          />
          <h2 style={{ fontSize: 'clamp(24px,5vw,30px)', fontWeight: 800, color: 'var(--ink)' }}>
            Accedi a InCrowd
          </h2>
          <p style={{ marginTop: 8, fontSize: 14.5, color: 'var(--ink-2)' }}>
            Bentornato! Inserisci le tue credenziali.
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
          <div>
            <label className="ic-label" htmlFor="email">
              <Icon name="mail" size={15} />
              Email
            </label>
            <input
              id="email"
              type="email"
              className="ic-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="La tua email"
            />
          </div>
          <div>
            <label className="ic-label" htmlFor="password">
              <Icon name="shield" size={15} />
              Password
            </label>
            <input
              id="password"
              type="password"
              className="ic-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="La tua password"
            />
          </div>
          <Button type="submit" full size="lg" disabled={loading} icon="arrowright">
            {loading ? 'Accesso in corso…' : 'Accedi'}
          </Button>
        </form>

        {googleOn && (
          <>
            {/* Divider "oppure" */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                margin: 'var(--s-6) 0',
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)' }}>oppure</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Pulsante Google renderizzato da GIS */}
            <div ref={googleRef} style={{ display: 'flex', justifyContent: 'center' }} />
          </>
        )}

        {errorMessage && (
          <div
            style={{
              marginTop: 'var(--s-5)',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '12px 14px',
              borderRadius: 'var(--r-sm)',
              background: 'var(--brand-soft)',
              color: 'var(--brand-700)',
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <Icon name="x" size={17} />
            {errorMessage}
          </div>
        )}

        <p
          style={{
            marginTop: 'var(--s-6)',
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--ink-2)',
          }}
        >
          Non hai un account?{' '}
          <Link to="/addUser" style={{ color: 'var(--brand-700)', fontWeight: 700 }}>
            Registrati
          </Link>
        </p>
      </Card>
    </div>
  )
}
