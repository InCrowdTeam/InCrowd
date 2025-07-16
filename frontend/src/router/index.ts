import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UserList from '../views/UserList.vue'
import SignUp from '../views/SignupView.vue'
import AdminOperatoriView from '../views/AdminOperatoriView.vue'
import AddPropostaView from '@/views/AddPropostaView.vue'
import LoginView from '@/views/LoginView.vue'
import ProfiloView from '@/views/ProfiloView.vue'
import ModerationPanel from '@/views/ModerationPanel.vue'
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
    path: '/admin/operatori',
    name: 'adminOperatori',
    component: AdminOperatoriView,
  },
  {
    path: '/moderation',
    name: 'moderation',
    component: ModerationPanel,
  },
  {
    path: '/addProposta',
    name: 'addProposta',
    component: AddPropostaView,
  },
  { path: '/login',
    name: 'Login',
    component: LoginView },
  {
    path: '/profilo',
    name: 'profilo',
    component: ProfiloView
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, _from, next) => {
  const store = useUserStore()
  if (to.path.startsWith('/admin') && store.user?.userType !== 'admin') {
    next('/login')
  } else if (to.path.startsWith('/moderation') && store.user?.userType !== 'operatore') {
    next('/login')
  } else {
    next()
  }
})


export default router
