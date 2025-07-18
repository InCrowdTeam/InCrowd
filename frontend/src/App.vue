<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { computed } from 'vue'

const userStore = useUserStore()
const router = useRouter()

// Funzione per navigazione programmatica alla pagina di aggiunta proposte
const goToAddProposta = () => router.push('/addproposta')

// Controlla se l'utente è un admin (usa il getter dello store)
const isAdmin = computed(() => userStore.isAdmin)

// Funzione logout che porta sempre alla home
const handleLogout = () => {
  userStore.logout()
  router.push('/')
}

// Funzioni per la gestione del profilo utente nella navbar
function processProfileImage(foto: any): string {
  if (!foto || !foto.data) return '';
  
  try {
    if (typeof foto.data === 'string') {
      return `data:${foto.contentType || 'image/jpeg'};base64,${foto.data}`;
    }
    
    if (Array.isArray(foto.data)) {
      let binary = '';
      const bytes = new Uint8Array(foto.data);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return `data:${foto.contentType || 'image/jpeg'};base64,${btoa(binary)}`;
    }
  } catch (e) {
    console.error('Errore nella conversione dell\'immagine profilo:', e);
  }
  
  return '';
}

function getUserInitials(): string {
  const user = userStore.user;
  if (!user) return 'U';
  
  const nome = user.nome?.charAt(0) || '';
  const cognome = user.cognome?.charAt(0) || '';
  return `${nome}${cognome}`.toUpperCase() || 'U';
}

function getUserDisplayName(): string {
  const user = userStore.user;
  if (!user) return 'Utente';
  
  return `${user.nome || ''} ${user.cognome || ''}`.trim() || 'Utente';
}

function getUserRole(): string {
  if (userStore.isAdmin) return '👑 Admin';
  if (userStore.isOperatore) return '🔧 Operatore';
  if (userStore.isEnte) return '🏢 Ente';
  return '👤 Utente';
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
          <RouterLink to="/profilo">Profilo</RouterLink>
          <button @click="handleLogout" class="logout-btn">Logout</button>
        </template>
        
        <!-- Menu per utenti normali -->
        <template v-else>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/users">Utenti</RouterLink>
          <RouterLink to="/addProposta">Aggiungi proposta</RouterLink>
          <RouterLink v-if="userStore.token" to="/profilo">Profilo</RouterLink>
          
          <!-- Area autenticazione -->
          <div v-if="!userStore.token" class="auth-buttons">
            <RouterLink to="/login" class="auth-btn login-btn">Login</RouterLink>
            <RouterLink to="/addUser" class="auth-btn register-btn">Registrati</RouterLink>
          </div>
          
          <!-- Profilo utente e logout -->
          <div v-if="userStore.token" class="user-profile-container">
            <div class="user-profile">
              <div class="user-avatar">
                <img 
                  v-if="userStore.user?.fotoProfilo" 
                  :src="processProfileImage(userStore.user.fotoProfilo)"
                  alt="Foto profilo"
                  class="profile-img"
                />
                <span v-else class="avatar-placeholder">{{ getUserInitials() }}</span>
              </div>
              <div class="user-info">
                <div class="user-name">
                  {{ getUserDisplayName() }}
                  <span v-if="userStore.isOperatore" class="operator-badge">🔧 Operatore</span>
                </div>
              </div>
              <button @click="handleLogout" class="logout-btn-new" title="Logout">
                <span class="logout-icon">�</span>
              </button>
            </div>
          </div>
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

.top-nav a:not(.auth-btn), .top-nav button:not(.logout-btn-new):not(.auth-btn) {
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

.top-nav a.router-link-exact-active:not(.auth-btn) {
  font-weight: bold;
  color: #fe4654;
}

.top-nav a:hover:not(.auth-btn), .top-nav button:hover:not(.logout-btn-new):not(.auth-btn) {
  background: rgba(255, 255, 255, 0.1);
}

/* Stili per i pulsanti di autenticazione */
.auth-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.3rem;
  border-radius: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.auth-btn {
  color: #fff !important;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 1.2rem;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.auth-btn.login-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.auth-btn.register-btn {
  background: #fe4654;
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

.auth-btn.register-btn:hover {
  background: #e63946;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(254, 70, 84, 0.4);
}

/* Container profilo utente */
.user-profile-container {
  margin-left: 1rem;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.6rem 1rem;
  border-radius: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.user-profile:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.user-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fe4654;
  flex-shrink: 0;
}

.profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: #fff;
  font-weight: bold;
  font-size: 0.8rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.user-name {
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.operator-badge {
  background: linear-gradient(135deg, #fe4654, #ff6b7a);
  color: #fff;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

.user-role {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
  font-weight: 500;
}

.logout-btn-new {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.logout-btn-new:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.logout-icon {
  filter: grayscale(0);
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