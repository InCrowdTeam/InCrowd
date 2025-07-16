<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const router = useRouter()
// Funzione per navigazione programmatica alla pagina di aggiunta proposte
const goToAddProposta = () => router.push('/addproposta')
</script>

<template>
  <div class="app-layout">
    <!-- HEADER -->
    <header class="main-header">
      <img alt="InCrowd logo" class="logo" src="@/assets/image.png" width="50" height="50" />
      <span class="brand">InCrowd</span>
      
      <!-- Search bar con label accessibile -->
      <div class="search-container">
        <label for="search" class="sr-only">Cerca eventi</label>
        <input id="search" class="search-bar" type="text" placeholder="Cerca gli eventi..." />
      </div>
      
      <nav class="top-nav">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/users">Utenti</RouterLink>
        <RouterLink to="/addUser">Registrati</RouterLink>
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
/* Utility per accessibilità */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

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

.brand {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.search-container {
  flex: 1;
  max-width: 350px;
  margin: 0 2rem;
  position: relative;
}

.search-bar {
  width: 100%;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  border: none;
  font-size: 1rem;
  transition: box-shadow 0.2s ease, background 0.2s ease;
}

.search-bar:focus {
  outline: none;
  box-shadow: 0 0 0 2px #fe4654;
  background: #fff;
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
  transition: background 0.2s ease, color 0.2s ease;
  cursor: pointer;
}

.top-nav a.router-link-exact-active {
  font-weight: bold;
  color: #fe4654;
}

.top-nav a:hover, .top-nav button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.main-content {
  flex: 1;
  padding: 2rem 1rem;
  background: var(--color-background-soft, #f8f7f3);
  color: #2b2c34;
  min-height: 0;
}

@media (max-width: 600px) {
  .main-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 1rem;
  }
  
  .search-container {
    margin: 1rem 0;
    width: 100%;
    max-width: none;
  }
  
  .main-content {
    padding: 1rem 0.5rem;
  }
}
</style>