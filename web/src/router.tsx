import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Layout } from '@/components/Layout'
import { useUserStore } from '@/stores/userStore'
import Home from '@/pages/Home'
import Placeholder from '@/pages/Placeholder'

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

// Helper per le pagine ancora da ridisegnare (Fasi 2-6).
const ph = (title: string, icon?: string) => <Placeholder title={title} icon={icon} />

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/proposte/:id', element: ph('Dettaglio proposta', 'sparkle') },
      {
        path: '/profilo',
        element: (
          <Guard requiresAuth hideFromOperators>
            {ph('Il mio profilo', 'user')}
          </Guard>
        ),
      },
      { path: '/users/:id', element: ph('Profilo utente', 'user') },
      {
        path: '/users',
        element: (
          <Guard requiresOperatorOrAdmin>{ph('Lista utenti', 'users')}</Guard>
        ),
      },
      {
        path: '/addProposta',
        element: <Guard requiresAuth>{ph('Aggiungi proposta', 'plus')}</Guard>,
      },
      { path: '/login', element: ph('Accedi', 'user') },
      { path: '/addUser', element: ph('Registrati', 'user') },
      { path: '/completeGoogleSignup', element: ph('Completa registrazione', 'user') },
      {
        path: '/admin/operatori',
        element: <Guard requiresAdmin>{ph('Gestione operatori', 'shield')}</Guard>,
      },
      {
        path: '/moderation',
        element: <Guard requiresOperator>{ph('Moderazione', 'shield')}</Guard>,
      },
      {
        path: '/pannello-operatore',
        element: <Guard requiresOperator>{ph('Pannello operatore', 'shield')}</Guard>,
      },
      { path: '/comments', element: ph('Ultimi commenti', 'comment') },
      { path: '/not-logged', element: <Placeholder title="Devi accedere" note="Accedi per visualizzare questa pagina." icon="user" /> },
      { path: '*', element: <Placeholder title="Pagina non trovata" note="La pagina che cerchi non esiste." icon="search" /> },
    ],
  },
])
