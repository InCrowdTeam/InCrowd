import { useEffect, useState } from 'react'
import type { IUser } from '@/types/User'
import { UserService } from '@/services/UserService'

const TINT_PALETTE = [
  'var(--cat-cultura)',
  'var(--cat-concerti)',
  'var(--cat-mostre)',
  'var(--cat-sport)',
  'var(--cat-workshop)',
  'var(--cat-conferenze)',
  'var(--brand)',
]

/** Colore stabile derivato dall'id (fallback decorativo: IUser reale non ha `tint`). */
function tintFor(seed?: string): string {
  if (!seed) return 'var(--brand)'
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return TINT_PALETTE[h % TINT_PALETTE.length]
}

function initialsOf(user?: IUser | null): string {
  if (!user) return '?'
  const a = user.nome?.trim()?.charAt(0) ?? ''
  const b = user.cognome?.trim()?.charAt(0) ?? ''
  return (a + b).toUpperCase() || a.toUpperCase() || '?'
}

export interface AvatarProps {
  user?: IUser | null
  /** URL avatar già risolto (es. da UserService.loadUserAvatar). */
  avatarUrl?: string
  /** Se true, prova a caricare l'avatar via endpoint dedicato usando user._id. */
  fetchAvatar?: boolean
  size?: number
  ring?: boolean
  tint?: string
}

export function Avatar({ user, avatarUrl, fetchAvatar = false, size = 40, ring = false, tint }: AvatarProps) {
  const inlineAvatar = avatarUrl || UserService.processUserAvatar(user)
  // Avatar caricato via endpoint dedicato, associato all'id per cui è stato risolto.
  const [fetched, setFetched] = useState<{ id?: string; url: string }>({ url: '' })

  useEffect(() => {
    if (inlineAvatar || !fetchAvatar || !user?._id) return
    let cancelled = false
    UserService.loadUserAvatar(user._id).then((url) => {
      if (!cancelled && url) setFetched({ id: user._id, url })
    })
    return () => {
      cancelled = true
    }
  }, [inlineAvatar, fetchAvatar, user?._id])

  const resolved = inlineAvatar || (fetched.id === user?._id ? fetched.url : '')

  const ringStyle = ring ? '0 0 0 3px var(--surface), 0 0 0 5px var(--brand)' : 'var(--shadow-sm)'

  if (resolved) {
    return (
      <img
        src={resolved}
        alt={user ? UserService.getFullName(user) : 'avatar'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          boxShadow: ringStyle,
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: tint || tintFor(user?._id),
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        fontFamily: 'var(--font-display)',
        fontSize: size * 0.38,
        letterSpacing: '-.02em',
        boxShadow: ringStyle,
      }}
    >
      {initialsOf(user)}
    </div>
  )
}
