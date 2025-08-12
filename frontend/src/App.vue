<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { computed } from 'vue'
import { useModal } from '@/composables/useModal'
import GlobalModal from '@/components/GlobalModal.vue'

const userStore = useUserStore()
const router = useRouter()
const { showConfirm } = useModal()

// Funzione per navigazione programmatica alla pagina di aggiunta proposte
const goToAddProposta = () => router.push('/addproposta')

// Controlla se l'utente è un admin (usa il getter dello store)
const isAdmin = computed(() => userStore.isAdmin)

// Funzione logout che porta sempre alla home
const handleLogout = () => {
  userStore.logout()
  router.push('/')
}

// Funzione per gestire il click sul logo admin
const handleAdminLogoClick = async () => {
  const result = await showConfirm(
    "Logout",
    "Per andare alla home verrà effettuata la disconnessione. Continuare?"
  );
  
  if (result) {
    handleLogout()
  }
}

// Funzione normale per click logo (operatori e end user)
const handleLogoClick = () => {
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
    <!-- NAVBAR ADMIN -->
    <header v-if="isAdmin" class="admin-navbar">
      <div class="navbar-left">
        <img 
          alt="InCrowd logo" 
          class="logo clickable-logo" 
          src="@/assets/image.png" 
          width="50" 
          height="50"
          @click="handleAdminLogoClick"
          title="Clicca per tornare alla home (verrà effettuato il logout)"
        />
        <span class="brand">InCrowd</span>
        
        <div class="admin-badge">
          <span class="admin-icon">👑</span>
          <span class="admin-text">Admin</span>
        </div>
        
        <nav class="nav-links">
          <RouterLink to="/admin/operatori">Gestione Operatori</RouterLink>
        </nav>
      </div>
      
      <div class="navbar-right">
        <div class="user-profile-container">
          <div class="user-profile">
            <div class="user-avatar">
              <span class="avatar-placeholder">{{ getUserInitials() }}</span>
            </div>
            <div class="user-info">
              <div class="user-name">Admin Sistema</div>
            </div>
            <button @click="handleLogout" class="logout-btn-new" title="Logout">
              <span class="logout-icon">🚪</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- NAVBAR OPERATORI -->
    <header v-else-if="userStore.isOperatore" class="operator-navbar">
      <div class="navbar-left">
        <img 
          alt="InCrowd logo" 
          class="logo clickable-logo" 
          src="@/assets/image.png" 
          width="50" 
          height="50"
          @click="handleLogoClick"
          title="Vai alla home"
        />
        <span class="brand">InCrowd</span>
        
        <div class="operator-badge">
          <span class="operator-icon">🔧</span>
          <span class="operator-text">Operatore</span>
        </div>
        
        <nav class="nav-links">
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/pannello-operatore">Pannello Operatore</RouterLink>
        </nav>
      </div>
      
      <div class="navbar-right">
        <div class="user-profile-container">
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
              <div class="user-name">{{ getUserDisplayName() }}</div>
            </div>
            <button @click="handleLogout" class="logout-btn-new" title="Logout">
              <span class="logout-icon">🚪</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- NAVBAR END USER (classica grigia) -->
    <header v-else class="enduser-navbar">
      <div class="navbar-left">
        <img 
          alt="InCrowd logo" 
          class="logo clickable-logo" 
          src="@/assets/image.png" 
          width="50" 
          height="50"
          @click="handleLogoClick"
          title="Vai alla home"
        />
        <span class="brand">InCrowd</span>
        
        <nav v-if="userStore.token" class="nav-links">
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/addProposta">Aggiungi proposta</RouterLink>
          <RouterLink v-if="!userStore.isOperatore" to="/profilo">Profilo</RouterLink>
        </nav>
      </div>
      
      <div class="navbar-right">
        <!-- Area autenticazione per utenti non loggati -->
        <div v-if="!userStore.token" class="auth-buttons">
          <RouterLink to="/login" class="auth-btn login-btn">Login</RouterLink>
          <RouterLink to="/addUser" class="auth-btn register-btn">Registrati</RouterLink>
        </div>
        
        <!-- Profilo utente e logout per utenti loggati -->
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
              <div class="user-name">{{ getUserDisplayName() }}</div>
            </div>
            <button @click="handleLogout" class="logout-btn-new" title="Logout">
              <span class="logout-icon">🚪</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- CONTENUTO CENTRALE -->
    <main class="main-content">
      <RouterView />
    </main>
    
    <!-- Modal globale per messaggi e conferme -->
    <GlobalModal />
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

/* ==== STILI COMUNI PER TUTTE LE NAVBAR ==== */
.admin-navbar,
.operator-navbar,
.enduser-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  gap: 1.5rem;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  flex-shrink: 0;
}

.clickable-logo {
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.clickable-logo:hover {
  transform: scale(1.05);
  opacity: 0.8;
}

.brand {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 1px;
  color: #fff;
  flex-shrink: 0;
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-links a {
  color: #fff;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  transition: background 0.2s ease, color 0.2s ease;
  font-weight: 500;
}

.nav-links a:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-links a.router-link-active {
  border-bottom: 2px solid #fe4654;
  font-weight: 600;
}

/* ==== NAVBAR ADMIN (colore attuale admin) ==== */
.admin-navbar {
  background: linear-gradient(135deg, #fe4654 0%, #404149 100%);
  box-shadow: 0 4px 20px rgba(254, 70, 84, 0.3);
  color: #fff;
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
}

.admin-icon {
  font-size: 1.2rem;
}

.admin-text {
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}

/* ==== NAVBAR OPERATORI (gradiente grigio-rosso) ==== */
.operator-navbar {
  background: linear-gradient(135deg, #5a5a5a 0%, #404149 50%, #fe4654 100%);
  box-shadow: 0 4px 20px rgba(254, 70, 84, 0.2);
  color: #fff;
}

.operator-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.5rem 1rem;
  border-radius: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.operator-icon {
  font-size: 1.2rem;
}

.operator-text {
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}

/* ==== NAVBAR END USER (grigia classica) ==== */
.enduser-navbar {
  background: #404149;
  color: #fff;
}

.enduser-navbar .brand {
  color: #fff;
}

/* ==== STILI AUTENTICAZIONE ==== */
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

/* ==== PROFILO UTENTE ==== */
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

/* ==== CONTENUTO PRINCIPALE ==== */
.main-content {
  flex: 1;
  padding: 2rem 1rem;
  background: var(--color-background-soft, #f8f7f3);
  color: #2b2c34;
  min-height: 0;
}

/* ==== RESPONSIVE ==== */
@media (max-width: 768px) {
  .admin-navbar,
  .operator-navbar,
  .enduser-navbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
  }
  
  .navbar-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    width: 100%;
  }
  
  .navbar-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .nav-links {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    width: 100%;
  }
  
  .main-content {
    padding: 1rem 0.5rem;
  }
}

@media (max-width: 480px) {
  .brand {
    font-size: 1.5rem;
  }
  
  .admin-badge,
  .operator-badge {
    padding: 0.4rem 0.8rem;
  }
  
  .admin-text,
  .operator-text {
    font-size: 0.8rem;
  }
}
</style>