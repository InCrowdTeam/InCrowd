import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UserList from '../views/UserList.vue'
import SignUp from '../views/SignupView.vue'
import AddPropostaView from '@/views/AddPropostaView.vue'
import LoginView from '@/views/LoginView.vue'
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
    path: '/addProposta',
    name: 'addProposta',
    component: AddPropostaView,
  },
  { path: '/login',
    name: 'Login',
    component: LoginView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})


const logout = () => {
  const userStore = useUserStore()
  userStore.logout()
  router.push('/login')
}

export default router
