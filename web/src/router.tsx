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

/**
 * Guard equivalenti a router.beforeEach del frontend Vue.
 * L'ORDINE dei controlli replica esattamente quello originale.
 */
interface GuardFlags {
  requiresAdmin?: boolean
  requiresOperatorOrAdmin?: boolean
  requiresOperator?: boolean
  requiresAuth?: boolean
  hideFromOperators?: boolean
}

function Guard({ children, ...flags }: GuardFlags & { children: ReactNode }) {
  const token = useUserStore((s) => s.token)
  const userType = useUserStore((s) => s.userType)
  const isAdmin = userType === 'admin'
  const isOperatore = userType === 'operatore'

  if (flags.requiresAdmin && !isAdmin) return <Navigate to="/login" replace />
  if (flags.requiresOperatorOrAdmin && !isOperatore && !isAdmin) return <Navigate to="/login" replace />
  if (flags.requiresOperator && !isOperatore) return <Navigate to="/login" replace />
  if (flags.requiresAuth && !token) return <Navigate to="/not-logged" replace />
  if (flags.hideFromOperators && isOperatore) return <Navigate to="/pannello-operatore" replace />
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
        element: <Guard requiresOperatorOrAdmin><UserList /></Guard>,
      },
      {
        path: '/addProposta',
        element: <Guard requiresAuth><AddProposta /></Guard>,
      },
      { path: '/login', element: <Login /> },
      { path: '/addUser', element: <Signup /> },
      { path: '/completeGoogleSignup', element: <CompleteGoogleSignup /> },
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
