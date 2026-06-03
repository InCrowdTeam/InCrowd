import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Layout } from '@/components/Layout'
import { useUserStore } from '@/stores/userStore'
import Home from '@/pages/Home'
import Proposta from '@/pages/Proposta'
import Profilo from '@/pages/Profilo'
import UserProfile from '@/pages/UserProfile'
import UserList from '@/pages/UserList'
import AddProposta from '@/pages/AddProposta'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import CompleteGoogleSignup from '@/pages/CompleteGoogleSignup'
import AdminOperatori from '@/pages/AdminOperatori'
import ModerationPanel from '@/pages/ModerationPanel'
import PannelloOperatore from '@/pages/PannelloOperatore'
import UltimiCommenti from '@/pages/UltimiCommenti'
import NotFound from '@/pages/NotFound'
import NotLogged from '@/pages/NotLogged'
import Forbidden from '@/pages/Forbidden'

/**
 * Guard equivalenti a router.beforeEach del frontend Vue, con la regola richiesta:
 * - utente NON loggato su pagina protetta → /not-logged (deve accedere)
 * - utente loggato ma SENZA il ruolo richiesto → 403 in-place (Forbidden), NON /login
 * - utente già loggato su pagina "ospite" (login/registrazione) → redirect alla sua home
 */
interface GuardFlags {
  requiresAdmin?: boolean
  requiresOperatorOrAdmin?: boolean
  requiresOperator?: boolean
  requiresAuth?: boolean
  hideFromOperators?: boolean
  /** Solo per ospiti: i loggati vengono reindirizzati (login, registrazione). */
  guestOnly?: boolean
}

function homeForRole(userType: string): string {
  if (userType === 'admin') return '/admin/operatori'
  if (userType === 'operatore') return '/pannello-operatore'
  return '/'
}

function Guard({ children, ...flags }: GuardFlags & { children: ReactNode }) {
  const token = useUserStore((s) => s.token)
  const userType = useUserStore((s) => s.userType)
  const loggedIn = !!token
  const isAdmin = userType === 'admin'
  const isOperatore = userType === 'operatore'

  // Pagine per soli ospiti: se sei già loggato non puoi andare su login/registrati.
  if (flags.guestOnly && loggedIn) return <Navigate to={homeForRole(userType)} replace />

  // Autenticazione richiesta.
  if (flags.requiresAuth && !loggedIn) return <Navigate to="/not-logged" replace />

  // Controlli di ruolo: non loggato → "devi accedere"; loggato col ruolo errato → 403.
  const needsRole = !!(flags.requiresAdmin || flags.requiresOperator || flags.requiresOperatorOrAdmin)
  if (needsRole && !loggedIn) return <Navigate to="/not-logged" replace />
  if (flags.requiresAdmin && !isAdmin) return <Forbidden />
  if (flags.requiresOperator && !isOperatore) return <Forbidden />
  if (flags.requiresOperatorOrAdmin && !isOperatore && !isAdmin) return <Forbidden />

  // Pagine senza senso per operatore/admin (profilo personale, creazione proposta).
  if (flags.hideFromOperators && (isOperatore || isAdmin)) return <Navigate to={homeForRole(userType)} replace />

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/proposte/:id', element: <Proposta /> },
      {
        path: '/profilo',
        element: (
          <Guard requiresAuth hideFromOperators>
            <Profilo />
          </Guard>
        ),
      },
      { path: '/users/:id', element: <UserProfile /> },
      {
        path: '/users',
        element: <Guard requiresOperator><UserList /></Guard>,
      },
      {
        path: '/addProposta',
        element: <Guard requiresAuth hideFromOperators><AddProposta /></Guard>,
      },
      { path: '/login', element: <Guard guestOnly><Login /></Guard> },
      { path: '/addUser', element: <Guard guestOnly><Signup /></Guard> },
      { path: '/completeGoogleSignup', element: <Guard guestOnly><CompleteGoogleSignup /></Guard> },
      {
        path: '/admin/operatori',
        element: <Guard requiresAdmin><AdminOperatori /></Guard>,
      },
      {
        path: '/moderation',
        element: <Guard requiresOperator><ModerationPanel /></Guard>,
      },
      {
        path: '/pannello-operatore',
        element: <Guard requiresOperator><PannelloOperatore /></Guard>,
      },
      {
        path: '/comments',
        element: <Guard requiresOperator><UltimiCommenti /></Guard>,
      },
      { path: '/not-logged', element: <NotLogged /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
