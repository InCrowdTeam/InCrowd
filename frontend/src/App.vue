<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const logout = () => {
  userStore.logout()
}
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/users">Utenti</RouterLink>
        <RouterLink to="/addUser">Aggiungi utente</RouterLink>
        <RouterLink to="/addProposta">Aggiungi proposta</RouterLink>
        <RouterLink to="/login">Login</RouterLink>
        <button v-if="userStore.token" @click="logout">Logout</button>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>

<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import HelloWorld from './components/HelloWorld.vue'

const userStore = useUserStore()
const router = useRouter()
const goToAddProposta = () => router.push('/addproposta')
</script>

<template>
  <div class="app-layout">
    <!-- HEADER -->
    <header class="main-header">
      <img alt="InCrowd logo" class="logo" src="@/assets/image.png" width="50" height="50" />
      <span class="brand">InCrowd</span>
      <input class="search-bar" type="text" placeholder="Cerca gli eventi..." />
      <nav class="top-nav">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/addProposta">Aggiungi proposta</RouterLink>
        <RouterLink to="/profilo">Profilo</RouterLink>
        <RouterLink to="/login">Login</RouterLink>
        <button v-if="userStore.token" @click="userStore.logout">Logout</button>
      </nav>
    </header>

    <!-- CONTENUTO CENTRALE -->
    <main class="main-content">
      <RouterView />
    </main>

    
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 100vw;
  background: var(--color-background-soft, #f8f7f3);
  position: relative;
}

.main-header {
  display: flex;
  align-items: center;
  background: #404149;
  color: #fff;
  padding: 1rem 2rem;
  gap: 1.5rem;
  border-bottom: 1px solid #404149;
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo {
  margin-right: 0.5rem;
}

.brand {
  font-size: 2rem;
  font-weight: bold;
  letter-spacing: 1px;
}

.search-bar {
  flex: 1;
  max-width: 350px;
  margin: 0 2rem;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  border: none;
  font-size: 1rem;
}

.top-nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.top-nav a, .top-nav button {
  color: #fff;
  background: none;
  border: none;
  font-size: 1rem;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.top-nav a.router-link-exact-active {
  font-weight: bold;
  color: #fe4654;
}

.top-nav a:hover, .top-nav button:hover {
  background: #2c2d34;
}

.main-content {
  flex: 1;
  padding: 2rem 1rem 5rem 1rem; /* spazio per la bottom nav */
  background: var(--color-background-soft, #f8f7f3);
  min-height: 0;
}

.bottom-nav {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100vw;
  background: #404149cc;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2.5rem;
  padding: 0.75rem 0;
  border-radius: 2rem 2rem 0 0;
  box-shadow: 0 -2px 16px rgba(0,0,0,0.08);
  z-index: 100;
}

.nav-btn {
  background: #fff;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.7rem;
  color: #404149;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: background 0.2s, color 0.2s;
}

.nav-btn.add-btn {
  background: #fe4654;
  color: #fff;
  font-size: 2.2rem;
  border: 3px solid #fff;
  margin: 0 0.5rem;
}

.nav-btn:active, .nav-btn:hover {
  background: #e6e6e6;
  color: #fe4654;
}

.nav-btn.add-btn:active, .nav-btn.add-btn:hover {
  background: #fff;
  color: #fe4654;
}

@media (max-width: 600px) {
  .main-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 1rem;
  }
  .search-bar {
    margin: 1rem 0;
    width: 100%;
    max-width: none;
  }
  .main-content {
    padding: 1rem 0.5rem 5rem 0.5rem;
  }
}
</style>
