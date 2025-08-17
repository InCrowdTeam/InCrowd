import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UserList from '../views/UserList.vue'
import SignUp from '../views/SignupView.vue'
import CompleteGoogleSignupView from '../views/CompleteGoogleSignupView.vue'
import AdminOperatoriView from '../views/AdminOperatoriView.vue'
import AddPropostaView from '@/views/AddPropostaView.vue'
import LoginView from '@/views/LoginView.vue'
import ProfiloView from '@/views/ProfiloView.vue'
import ModerationPanel from '@/views/ModerationPanel.vue'
import NotLoggedView from '@/views/NotLoggedView.vue'
import PannelloOperatoreView from '@/views/PannelloOperatoreView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import UltimiCommentiView from '@/views/UltimiCommentiView.vue'
import { useUserStore } from '@/stores/userStore'
import PropostaView from '@/views/PropostaView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/users',
    name: 'users',
    component: UserList,
    meta: { requiresOperatorOrAdmin: true }
  },
  {
    path: '/addUser',
    name: 'addUser',
    component: SignUp,
  },
  {
    path: '/completeGoogleSignup',
    name: 'completeGoogleSignup',
    component: CompleteGoogleSignupView,
  },
  {
    path: '/admin/operatori',
    name: 'adminOperatori',
    component: AdminOperatoriView,
    meta: { requiresAdmin: true }
  },
  {
    path: '/moderation',
    name: 'moderation',
    component: ModerationPanel,
    meta: { requiresOperator: true }
  },
  {
    path: '/pannello-operatore',
    name: 'pannelloOperatore',
    component: PannelloOperatoreView,
    meta: { requiresOperator: true }
  },
  {
    path: '/addProposta',
    name: 'addProposta',
    component: AddPropostaView,
    meta: { requiresAuth: true }
  },
  {
    path: '/proposte/:id',
    name: 'proposta',
    component: PropostaView
  },
  { path: '/login',
    name: 'Login',
    component: LoginView },
  {
    path: '/profilo',
    name: 'profilo',
    component: ProfiloView,
    meta: { requiresAuth: true, hideFromOperators: true }
  },
  {
    path: '/not-logged',
    name: 'notLogged',
    component: NotLoggedView
  },
  {
    path: '/users/:id',
    name: 'UserProfile',
    component: () => import('../views/UserProfileView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: NotFoundView
  },
  {
    path: '/comments',
    name: 'UltimiCommenti',
    component: UltimiCommentiView
  },  
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, _from, next) => {
  const store = useUserStore()
  
  // Guard per pagine admin
  if (to.meta.requiresAdmin && !store.isAdmin) {
    next('/login')
    return
  }
  
  // Guard per pagine operatore o admin
  if (to.meta.requiresOperatorOrAdmin && !store.isOperatore && !store.isAdmin) {
    next('/login')
    return
  }
  
  // Guard per pagine operatore  
  if (to.meta.requiresOperator && !store.isOperatore) {
    next('/login')
    return
  }
  
  // Guard per pagine che richiedono autenticazione
  if (to.meta.requiresAuth && !store.token) {
    next('/not-logged')
    return
  }
  
  // Guard per nascondere pagine agli operatori
  if (to.meta.hideFromOperators && store.isOperatore) {
    next('/pannello-operatore')
    return
  }
  
  next()
})


export default router
