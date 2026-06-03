import { useParams } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import { ProfileScreen } from '@/components/ProfileScreen'
import { Icon } from '@/components/ui'

/**
 * Pagina /users/:id — profilo pubblico di un utente.
 * Se l'id coincide con quello dell'utente loggato, mostriamo la stessa schermata
 * in modalità "isMe" (con notice e pulsante Modifica), come in UserProfileView.vue.
 */
export default function UserProfile() {
  const { id } = useParams<{ id: string }>()
  const currentUserId = useUserStore((s) => s.user?._id)

  if (!id) {
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
        <h3 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>Utente non trovato</h3>
        <p style={{ fontSize: 14.5 }}>L'identificativo dell'utente non è valido.</p>
      </div>
    )
  }

  const isMe = !!currentUserId && currentUserId === id

  return <ProfileScreen key={id} userId={id} isMe={isMe} />
}
