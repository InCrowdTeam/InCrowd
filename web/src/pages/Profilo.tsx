import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useUserStore, selectIsOperatore } from '@/stores/userStore'
import { ProfileScreen } from '@/components/ProfileScreen'
import { Button, Icon } from '@/components/ui'

/**
 * Pagina /profilo — profilo dell'utente loggato.
 * Il router applica già il guard (requiresAuth, hideFromOperators); qui gestiamo
 * comunque i casi limite (operatore o utente assente) per coerenza con ProfiloView.vue.
 */
export default function Profilo() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const isOperatore = useUserStore(selectIsOperatore)

  // Coerente con ProfiloView.vue: gli operatori non hanno un profilo pubblico.
  useEffect(() => {
    if (isOperatore) navigate('/pannello-operatore', { replace: true })
  }, [isOperatore, navigate])

  if (isOperatore) return null

  if (!user?._id) {
    return (
      <div
        style={{
          maxWidth: 'var(--maxw)',
          margin: '0 auto',
          padding: 'clamp(16px,3vw,28px) clamp(14px,4vw,28px) 80px',
          textAlign: 'center',
          color: 'var(--ink-3)',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--surface-3)',
            display: 'grid',
            placeItems: 'center',
            margin: '70px auto 18px',
          }}
        >
          <Icon name="user" size={30} />
        </div>
        <h3 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>Devi accedere</h3>
        <p style={{ fontSize: 14.5, marginBottom: 18 }}>Accedi per visualizzare il tuo profilo.</p>
        <div style={{ display: 'inline-flex' }}>
          <Button onClick={() => navigate('/login')}>Accedi</Button>
        </div>
      </div>
    )
  }

  return <ProfileScreen userId={user._id} isMe />
}
