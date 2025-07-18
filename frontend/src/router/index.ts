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
import { useUserStore } from '@/stores/userStore'

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
    path: '/addProposta',
    name: 'addProposta',
    component: AddPropostaView,
    meta: { requiresAuth: true }
  },
  { path: '/login',
    name: 'Login',
    component: LoginView },
  {
    path: '/profilo',
    name: 'profilo',
    component: ProfiloView,
    meta: { requiresAuth: true }
  },
  {
    path: '/not-logged',
    name: 'notLogged',
    component: NotLoggedView
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, _from, next) => {
  const store = useUserStore()
  
  // Guard per pagine admin
  if (to.meta.requiresAdmin && store.user?.userType !== 'admin') {
    next('/login')
    return
  }
  
  // Guard per pagine operatore  
  if (to.meta.requiresOperator && store.user?.userType !== 'operatore') {
    next('/login')
    return
  }
  
  // Guard per pagine che richiedono autenticazione
  if (to.meta.requiresAuth && !store.token) {
    next('/not-logged')
    return
  }
  
  next()
})


export default router
