import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import { useFollowStore } from '@/stores/followStore'
import { useTheme } from '@/lib/theme'
import { UserService } from '@/services/UserService'
import { clearAuthorCache } from '@/hooks/useAuthor'
import { Avatar, Icon } from '@/components/ui'
import incrowdLogo from '@/assets/incrowd-logo.png'

interface NavItem {
  label: string
  icon: string
  path: string
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  privato: [
    { label: 'Home', icon: 'home', path: '/' },
    { label: 'Aggiungi proposta', icon: 'plus', path: '/addProposta' },
    { label: 'Profilo', icon: 'user', path: '/profilo' },
  ],
  ente: [
    { label: 'Home', icon: 'home', path: '/' },
    { label: 'Aggiungi proposta', icon: 'plus', path: '/addProposta' },
    { label: 'Profilo', icon: 'building', path: '/profilo' },
  ],
  operatore: [
    { label: 'Home', icon: 'home', path: '/' },
    { label: 'Pannello Operatore', icon: 'shield', path: '/pannello-operatore' },
  ],
  admin: [{ label: 'Gestione Operatori', icon: 'users', path: '/admin/operatori' }],
}

// Niente badge per l'utente privato (ridondante): solo Ente/Operatore/Admin.
const ROLE_META: Record<string, { label: string; icon: string; color: string }> = {
  ente: { label: 'Ente', icon: 'building', color: 'var(--cat-cultura)' },
  operatore: { label: 'Operatore', icon: 'tool', color: 'var(--ink-2)' },
  admin: { label: 'Admin', icon: 'shield', color: 'var(--brand)' },
}

function Logo({ size = 32 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src={incrowdLogo} alt="InCrowd" width={size} height={size} style={{ display: 'block', flexShrink: 0 }} />
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: size * 0.62,
          letterSpacing: '-.03em',
          color: 'var(--ink)',
        }}
      >
        InCrowd
      </span>
    </div>
  )
}

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token, userType, logout } = useUserStore()
  const clearFollowCache = useFollowStore((s) => s.clearCache)
  const { resolved, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const loggedIn = !!token
  const items = loggedIn ? NAV_BY_ROLE[userType] ?? [] : []
  const rm = ROLE_META[userType]
  const isUserOrEnte = userType === 'privato' || userType === 'ente'

  const fullName = user ? UserService.getFullName(user) : ''
  const email = user?.credenziali?.email ?? user?.email ?? ''

  const handleLogout = () => {
    logout()
    UserService.clearAvatarCache()
    clearFollowCache()
    clearAuthorCache()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--maxw)',
          margin: '0 auto',
          height: 'var(--nav-h)',
          padding: '0 clamp(16px,4vw,28px)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--s-5)',
        }}
      >
        <button onClick={() => navigate(items[0]?.path || '/')} style={{ display: 'flex' }}>
          <Logo />
        </button>

        {rm && (
          <span
            className="nav-rolebadge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 11px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--surface-3)',
              fontSize: 12.5,
              fontWeight: 700,
              color: rm.color,
            }}
          >
            <Icon name={rm.icon} size={13} stroke={2.2} />
            {rm.label}
          </span>
        )}

        <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
          {items.map((it) => {
            const on = location.pathname === it.path
            return (
              <button
                key={it.path}
                onClick={() => navigate(it.path)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 14px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 14.5,
                  fontWeight: on ? 700 : 600,
                  color: on ? 'var(--brand-700)' : 'var(--ink-2)',
                  background: on ? 'var(--brand-soft)' : 'transparent',
                  transition: 'all .16s var(--ease)',
                }}
              >
                <Icon name={it.icon} size={16} stroke={on ? 2.2 : 1.8} />
                {it.label}
              </button>
            )
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <button
          onClick={toggle}
          title="Cambia tema"
          className="ic-btn"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--ink-2)',
          }}
        >
          <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>

        {loggedIn ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '5px 7px 5px 5px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Avatar user={user} fetchAvatar size={32} />
              <span className="nav-username" style={{ fontWeight: 700, fontSize: 14 }}>
                {fullName.length > 16 ? fullName.slice(0, 15) + '…' : fullName}
              </span>
              <Icon name="chevdown" size={15} style={{ color: 'var(--ink-3)', marginRight: 3 }} />
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
                <div
                  className="fade-in"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    zIndex: 2,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: 7,
                    minWidth: 210,
                  }}
                >
                  <div style={{ padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar user={user} fetchAvatar size={38} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {fullName}
                      </div>
                      {email && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--ink-3)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  {isUserOrEnte && (
                    <button
                      onClick={() => {
                        navigate('/profilo')
                        setMenuOpen(false)
                      }}
                      className="menu-row"
                    >
                      <Icon name="user" size={17} />
                      Il mio profilo
                    </button>
                  )}
                  <button onClick={toggle} className="menu-row">
                    <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={17} />
                    Tema {resolved === 'dark' ? 'chiaro' : 'scuro'}
                  </button>
                  <button onClick={handleLogout} className="menu-row" style={{ color: 'var(--brand-700)' }}>
                    <Icon name="logout" size={17} />
                    Esci
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => navigate('/login')}
              className="ic-btn"
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--r-pill)',
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--ink-2)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            >
              Accedi
            </button>
            <button
              onClick={() => navigate('/addUser')}
              className="ic-btn"
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--r-pill)',
                fontWeight: 700,
                fontSize: 14,
                color: '#fff',
                background: 'var(--brand)',
                boxShadow: '0 4px 14px rgba(255,77,94,.32)',
              }}
            >
              Registrati
            </button>
          </div>
        )}
      </div>

      {/* nav a pillole su mobile */}
      {items.length > 1 && (
        <div className="nav-mobile" style={{ gap: 4, padding: '0 14px 12px', overflowX: 'auto' }}>
          {items.map((it) => {
            const on = location.pathname === it.path
            return (
              <button
                key={it.path}
                onClick={() => navigate(it.path)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 13px',
                  whiteSpace: 'nowrap',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 13.5,
                  fontWeight: on ? 700 : 600,
                  color: on ? '#fff' : 'var(--ink-2)',
                  background: on ? 'var(--brand)' : 'var(--surface-3)',
                }}
              >
                <Icon name={it.icon} size={15} />
                {it.label}
              </button>
            )
          })}
        </div>
      )}
    </header>
  )
}
