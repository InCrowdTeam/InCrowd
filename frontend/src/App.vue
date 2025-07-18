<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { computed } from 'vue'

const userStore = useUserStore()
const router = useRouter()

// Funzione per navigazione programmatica alla pagina di aggiunta proposte
const goToAddProposta = () => router.push('/addproposta')

// Controlla se l'utente è un admin
const isAdmin = computed(() => userStore.user?.userType === 'admin')

// Funzione logout che porta sempre alla home
const handleLogout = () => {
  userStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="app-layout">
    <!-- HEADER -->
    <header class="main-header" :class="{ 'admin-header': isAdmin }">
      <img alt="InCrowd logo" class="logo" src="@/assets/image.png" width="50" height="50" />
      <span class="brand">InCrowd</span>
      
      <!-- Badge Admin -->
      <div v-if="isAdmin" class="admin-badge">
        <span class="admin-icon">👑</span>
        <span class="admin-text">Admin Panel</span>
      </div>
      
      <!-- Search bar con label accessibile (solo per utenti normali) -->
      <div v-if="!isAdmin" class="search-container">
        <label for="search" class="sr-only">Cerca eventi</label>
        <input id="search" class="search-bar" type="text" placeholder="Cerca gli eventi..." />
      </div>
      
      <nav class="top-nav">
        <!-- Menu per Admin -->
        <template v-if="isAdmin">
          <RouterLink to="/admin/operatori">Gestione Operatori</RouterLink>
          <button @click="handleLogout" class="logout-btn">Logout</button>
        </template>
        
        <!-- Menu per utenti normali -->
        <template v-else>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/users">Utenti</RouterLink>
          <RouterLink v-if="!userStore.token" to="/addUser">Registrati</RouterLink>
          <RouterLink to="/addProposta">Aggiungi proposta</RouterLink>
          <RouterLink v-if="userStore.token" to="/profilo">Profilo</RouterLink>
          <RouterLink v-if="!userStore.token" to="/login">Login</RouterLink>
          <button v-if="userStore.token" @click="handleLogout" class="logout-btn">Logout</button>
        </template>
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

/* Admin Header Styles */
.admin-header {
  background: linear-gradient(135deg, #fe4654 0%, #404149 100%);
  box-shadow: 0 4px 20px rgba(254, 70, 84, 0.3);
  position: relative;
  overflow: hidden;
}

.admin-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  pointer-events: none;
}

.admin-header > * {
  position: relative;
  z-index: 1;
}

.admin-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.5rem 1rem;
  border-radius: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-left: auto;
  margin-right: 1rem;
}

.admin-icon {
  font-size: 1.2rem;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.8);
  }
  to {
    text-shadow: 0 0 20px rgba(255, 215, 0, 1), 0 0 30px rgba(255, 215, 0, 0.5);
  }
}

.admin-text {
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 1rem !important;
  padding: 0.5rem 1rem !important;
  font-weight: 600 !important;
  transition: all 0.2s ease !important;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  transform: translateY(-1px);
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