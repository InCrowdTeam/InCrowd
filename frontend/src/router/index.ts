import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import UserList from '../views/UserList.vue'
import SignUp from '../views/SignupView.vue'
import LoginView from '../views/LoginView.vue'
import AddPropostaView from '../views/AddPropostaView.vue'
import ProfiloView from '../views/ProfiloView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
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
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/addproposta',
    name: 'addproposta',
    component: AddPropostaView,
  },
  {
    path: '/profilo',
    name: 'profilo',
    component: ProfiloView,
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
