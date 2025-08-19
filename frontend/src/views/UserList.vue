<template>
  <div class="users-panel">
    <!-- Header della pagina -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">👥</div>
        <div class="header-text">
          <h1>Gestione Utenti ed Enti</h1>
          <p>Visualizza e gestisci tutti gli utenti ed enti registrati sulla piattaforma</p>
        </div>
      </div>
      <div class="header-stats" v-if="!loading">
        <div class="stat-badge">
          <span class="stat-number">{{ filteredUsers.length }}</span>
          <span class="stat-label">{{ filteredUsers.length === 1 ? 'Utente/Ente' : 'Utenti/Enti' }}</span>
        </div>
        <div class="stat-badge" v-if="users.length > 0">
          <span class="stat-number">{{ users.filter(u => u.userType === 'user').length }}</span>
          <span class="stat-label">Utenti</span>
        </div>
        <div class="stat-badge" v-if="users.length > 0">
          <span class="stat-number">{{ users.filter(u => u.userType === 'ente').length }}</span>
          <span class="stat-label">Enti</span>
        </div>
      </div>
    </div>

    <!-- Barra di ricerca e filtri -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-icon">🔍</div>
        <input
          class="search-input"
          type="text"
          v-model="search"
          placeholder="Cerca utenti ed enti per nome, cognome o email..."
        />
        <div v-if="search" class="clear-search" @click="search = ''">✕</div>
      </div>
      
      <div class="filters-container">
        <select v-model="filterType" class="filter-select">
          <option value="all">Tutti gli utenti ed enti</option>
          <option value="user">Solo utenti normali</option>
          <option value="ente">Solo enti</option>
        </select>
        
        <select v-model="sortBy" class="filter-select">
          <option value="name">Ordina per nome</option>
          <option value="email">Ordina per email</option>
          <option value="date">Ordina per data registrazione</option>
        </select>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Caricamento utenti...</p>
    </div>

    <!-- Lista utenti -->
    <div v-else-if="filteredUsers.length" class="users-section">
      <div class="users-grid">
        <div
          v-for="user in paginatedUsers"
          :key="user._id"
          class="user-card"
        >
          <!-- Avatar utente -->
          <div class="user-image-container">
            <img 
              v-if="user.fotoProfilo?.data"
              :src="`data:${user.fotoProfilo.contentType};base64,${user.fotoProfilo.data}`"
              class="user-image"
              alt="Foto profilo" 
            />
            <div v-else class="user-image-placeholder">
              <span>{{ getUserInitials(user) }}</span>
            </div>
          </div>

          <!-- Contenuto utente -->
          <div class="user-content">
            <div class="user-header">
              <h3 class="user-title">{{ user.nome }}{{ user.cognome ? ` ${user.cognome}` : '' }}</h3>
              <div class="user-status">
                <span class="status-badge" :class="getUserTypeClass(user)">{{ getUserTypeLabel(user) }}</span>
              </div>
            </div>

            <p class="user-email">{{ user.credenziali.email }}</p>

            <!-- Dettagli -->
            <div class="user-details">
              <div class="detail-item" v-if="user.biografia">
                <span class="detail-label">Bio:</span>
                <span class="detail-value">{{ truncateText(user.biografia, 50) }}</span>
              </div>
              <div class="detail-item" v-if="user.createdAt">
                <span class="detail-label">Registrato:</span>
                <span class="detail-value">{{ formatDate(user.createdAt) }}</span>
              </div>
              <div class="detail-item" v-if="user.indirizzo">
                <span class="detail-label">Località:</span>
                <span class="detail-value">{{ user.indirizzo.citta || 'Non specificata' }}</span>
              </div>
            </div>

            <!-- Azioni utente -->
            <div class="user-actions">
              <button 
                @click="viewUserDetails(user)" 
                class="action-btn details-btn"
                title="Visualizza dettagli"
              >
                <span class="btn-icon">👁️</span>
                <span class="btn-text">Dettagli</span>
              </button>
              <button 
                @click="contactUser(user)" 
                class="action-btn contact-btn"
                title="Contatta utente"
              >
                <span class="btn-icon">✉️</span>
                <span class="btn-text">Contatta</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Paginazione -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          ← Precedente
        </button>
        
        <div class="pagination-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(typeof page === 'number' ? page : currentPage)"
            :class="{ active: page === currentPage }"
            class="pagination-number"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          Successivo →
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <div class="empty-icon">👤</div>
      <h3>{{ search ? 'Nessun utente trovato' : 'Nessun utente registrato' }}</h3>
      <p>{{ search ? 'Prova a modificare i termini di ricerca' : 'Non ci sono ancora utenti registrati sulla piattaforma' }}</p>
    </div>

    <!-- Modal dettagli utente -->
    <div v-if="showUserModal" class="modal-overlay" @click="closeUserModal">
      <div class="modal-content user-modal" @click.stop>
        <div class="modal-header">
          <h3>Dettagli Utente</h3>
          <button @click="closeUserModal" class="close-btn">✕</button>
        </div>
        
        <div v-if="selectedUser" class="user-details-full">
          <div class="user-summary">
            <div class="user-avatar-large">
              <img 
                v-if="selectedUser.fotoProfilo?.data"
                :src="`data:${selectedUser.fotoProfilo.contentType};base64,${selectedUser.fotoProfilo.data}`"
                alt="Foto profilo" 
              />
              <div v-else class="avatar-placeholder-large">
                <span>{{ getUserInitials(selectedUser) }}</span>
              </div>
            </div>
            <div class="user-summary-info">
              <h4>{{ selectedUser.nome }}{{ selectedUser.cognome ? ` ${selectedUser.cognome}` : '' }}</h4>
              <p class="user-email-large">{{ selectedUser.credenziali.email }}</p>
              <div class="user-type-badge large" :class="getUserTypeClass(selectedUser)">
                {{ getUserTypeLabel(selectedUser) }}
              </div>
            </div>
          </div>

          <div class="details-grid">
            <div class="detail-section">
              <h5>Informazioni Personali</h5>
              <div class="detail-item">
                <span class="label">Nome:</span>
                <span class="value">{{ selectedUser.nome }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Cognome:</span>
                <span class="value">{{ selectedUser.cognome }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Email:</span>
                <span class="value">{{ selectedUser.credenziali.email }}</span>
              </div>
              <div class="detail-item" v-if="selectedUser.biografia">
                <span class="label">Biografia:</span>
                <span class="value">{{ selectedUser.biografia }}</span>
              </div>
            </div>

            <div class="detail-section" v-if="selectedUser.indirizzo">
              <h5>Indirizzo</h5>
              <div class="detail-item" v-if="selectedUser.indirizzo.citta">
                <span class="label">Città:</span>
                <span class="value">{{ selectedUser.indirizzo.citta }}</span>
              </div>
              <div class="detail-item" v-if="selectedUser.indirizzo.cap">
                <span class="label">CAP:</span>
                <span class="value">{{ selectedUser.indirizzo.cap }}</span>
              </div>
              <div class="detail-item" v-if="selectedUser.indirizzo.via">
                <span class="label">Via:</span>
                <span class="value">{{ selectedUser.indirizzo.via }} {{ selectedUser.indirizzo.civico || '' }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h5>Informazioni Account</h5>
              <div class="detail-item">
                <span class="label">Tipo utente:</span>
                <span class="value">{{ getUserTypeLabel(selectedUser) }}</span>
              </div>
              <div class="detail-item" v-if="selectedUser.createdAt">
                <span class="label">Registrato il:</span>
                <span class="value">{{ new Date(selectedUser.createdAt).toLocaleDateString('it-IT', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { getAllUsers } from '@/api/userApi'
import { useModal } from '@/composables/useModal'
import axios from 'axios'

// Tipi
interface User {
  _id: string
  nome: string
  cognome?: string // Opzionale per gli enti
  credenziali: {
    email: string
  }
  biografia?: string
  createdAt?: string
  indirizzo?: {
    citta?: string
    cap?: string
    via?: string
    civico?: string
  }
  fotoProfilo?: {
    data: string
    contentType: string
  }
  ruolo?: string
  userType?: string // Per distinguere il tipo (user, ente, operatore)
  codiceFiscale?: string
}

const store = useUserStore()
const { showError } = useModal()

// Stato reattivo
const users = ref<User[]>([])
const loading = ref(false)
const search = ref('')
const filterType = ref('all')
const sortBy = ref('name')
const currentPage = ref(1)
const usersPerPage = 12
const showUserModal = ref(false)
const selectedUser = ref<User | null>(null)

// Computed properties
const filteredUsers = computed(() => {
  let filtered = [...users.value]

  // Filtro per tipo
  if (filterType.value !== 'all') {
    filtered = filtered.filter(user => {
      switch (filterType.value) {
        case 'user':
          return user.userType === 'user'
        case 'ente':
          return user.userType === 'ente'
        case 'operatore':
          return user.userType === 'operatore' || user.ruolo === 'operatore'
        default:
          return true
      }
    })
  }

  // Filtro per ricerca
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(user =>
      user.nome.toLowerCase().includes(searchLower) ||
      (user.cognome && user.cognome.toLowerCase().includes(searchLower)) ||
      user.credenziali.email.toLowerCase().includes(searchLower) ||
      (user.biografia && user.biografia.toLowerCase().includes(searchLower))
    )
  }

  // Ordinamento
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return `${a.nome} ${a.cognome || ''}`.localeCompare(`${b.nome} ${b.cognome || ''}`)
      case 'email':
        return a.credenziali.email.localeCompare(b.credenziali.email)
      case 'date':
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      default:
        return 0
    }
  })

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / usersPerPage)
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * usersPerPage
  const end = start + usersPerPage
  return filteredUsers.value.slice(start, end)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const delta = 2
  const range = []

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }

  if (current - delta > 2) {
    range.unshift('...')
  }
  if (current + delta < total - 1) {
    range.push('...')
  }

  range.unshift(1)
  if (total > 1) {
    range.push(total)
  }

  return range.filter((v, i, arr) => arr.indexOf(v) === i)
})

// Metodi
const loadUsers = async () => {
  try {
    loading.value = true
    
    // Usa il nuovo endpoint unificato per tutti gli utenti
    const usersResponse = await getAllUsers(store.token);
    
    let allUsers: User[] = []
    
    // Processa tutti gli utenti (privati ed enti insieme)
    if (usersResponse.data && usersResponse.data.users) {
      allUsers = usersResponse.data.users.map((user: any) => ({
        ...user,
        userType: user.user_type || 'user' // Mappa il campo unificato
      }))
    }
    
    users.value = allUsers
  } catch (error) {
    console.error('Errore nel caricamento degli utenti:', error)
    
    // Gestisci l'errore più elegantemente
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        showError('Timeout nel caricamento degli utenti', 'Il server potrebbe essere lento. Riprova.');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        showError('Sessione scaduta', 'Effettua nuovamente il login.');
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        showError('Permessi insufficienti', 'Non hai i permessi per visualizzare gli utenti.');
      } else if (error.message.includes('500')) {
        showError('Errore del server', 'Riprova più tardi.');
      } else {
        showError('Errore nel caricamento degli utenti', error.message || 'Errore sconosciuto');
      }
    } else {
      showError('Errore nel caricamento degli utenti', 'Errore sconosciuto');
    }
    
    users.value = []
  } finally {
    loading.value = false
  }
}

const getUserInitials = (user: User): string => {
  const firstName = user.nome?.charAt(0) || ''
  const lastName = user.cognome?.charAt(0) || ''
  return (firstName + lastName).toUpperCase()
}

const getUserTypeClass = (user: User): string => {
  switch (user.userType) {
    case 'ente':
      return 'type-ente'
    case 'operatore':
      return 'type-operatore'
    case 'user':
      return 'type-user'
    default:
      // Fallback per compatibilità con il vecchio sistema
      switch (user.ruolo) {
        case 'ente':
          return 'type-ente'
        case 'operatore':
          return 'type-operatore'
        default:
          return 'type-user'
      }
  }
}

const getUserTypeLabel = (user: User): string => {
  switch (user.userType) {
    case 'ente':
      return 'Ente'
    case 'operatore':
      return 'Operatore'
    case 'user':
      return 'Utente'
    default:
      // Fallback per compatibilità con il vecchio sistema
      switch (user.ruolo) {
        case 'ente':
          return 'Ente'
        case 'operatore':
          return 'Operatore'
        default:
          return 'Utente'
      }
  }
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatDate = (dateString: string): string => {
  if (!dateString) return 'Non disponibile'
  return new Date(dateString).toLocaleDateString('it-IT')
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const viewUserDetails = (user: User) => {
  selectedUser.value = user
  showUserModal.value = true
}

const closeUserModal = () => {
  showUserModal.value = false
  selectedUser.value = null
}

const contactUser = (user: User) => {
  const subject = encodeURIComponent('Contatto dalla piattaforma InCrowd')
  const body = encodeURIComponent(`Ciao ${user.nome},\n\n`)
  window.open(`mailto:${user.credenziali.email}?subject=${subject}&body=${body}`)
}

// Lifecycle
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-panel {
  min-height: 100vh;
  background: #f8f7f3;
  padding-bottom: 2rem;
}

/* Header */
.page-header {
  background: linear-gradient(135deg, #fe4654, #404149);
  color: #fff;
  padding: 2.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2rem 2rem 0 2rem;
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(254, 70, 84, 0.3);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(50%, -50%);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

.header-icon {
  font-size: 3.5rem;
  opacity: 0.95;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));
}

.header-text h1 {
  font-size: 2.2rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.header-text p {
  margin: 0;
  opacity: 0.95;
  font-size: 1.1rem;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.header-stats {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.stat-badge {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 120px;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Search Section */
.search-section {
  max-width: 1200px;
  margin: 2rem auto 0;
  padding: 0 2rem;
}

.search-container {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-icon {
  position: absolute;
  left: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 1.2rem;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 1rem;
  background: #fff;
  color: #404149;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.search-input::placeholder {
  color: #999;
}

.search-input:focus {
  outline: none;
  border-color: #fe4654;
  box-shadow: 0 2px 16px rgba(254, 70, 84, 0.15);
}

.clear-search {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  cursor: pointer;
  font-size: 1.2rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.clear-search:hover {
  background: #f0f0f0;
  color: #666;
}

.filters-container {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 0.8rem;
  background: #fff;
  color: #404149;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.filter-select:focus {
  outline: none;
  border-color: #fe4654;
}

/* Loading */
.loading-section {
  text-align: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #fe4654;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Users */
.users-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 2rem;
}

.user-card {
  background: #fff;
  border-radius: 1.2rem;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

.user-image-container {
  width: 100%;
  height: 120px;
  overflow: hidden;
  background: #f8f7f3;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.user-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.user-image-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fe4654, #404149);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.user-content {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.user-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #404149;
  margin: 0;
  line-height: 1.3;
  flex: 1;
}

.user-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.type-user {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #bbdefb;
}

.status-badge.type-ente {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
}

.status-badge.type-operatore {
  background: #fff3e0;
  color: #ef6c00;
  border: 1px solid #ffcc02;
}

.user-email {
  color: #666;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
  font-size: 0.9rem;
}

.user-details {
  background: #f8f7f3;
  padding: 1rem;
  border-radius: 0.8rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.detail-value {
  color: #404149;
  font-size: 0.9rem;
}

/* Actions */
.user-actions {
  display: flex;
  gap: 0.8rem;
  margin-top: auto;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  border: none;
  border-radius: 0.8rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.details-btn {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.details-btn:hover {
  background: #bee5eb;
  transform: translateY(-1px);
}

.contact-btn {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.contact-btn:hover {
  background: #c3e6cb;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination-btn,
.pagination-number {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 0.8rem;
  background: #fff;
  color: #404149;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.pagination-btn:hover:not(:disabled),
.pagination-number:hover {
  border-color: #fe4654;
  background: #fef7f7;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #f0f0f0;
}

.pagination-number.active {
  background: #fe4654;
  color: #fff;
  border-color: #fe4654;
}

.pagination-numbers {
  display: flex;
  gap: 0.5rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 500px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state h3 {
  color: #404149;
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #666;
  margin: 0;
  font-size: 1rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.user-modal {
  color: #404149;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #404149;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #666;
}

.user-details-full {
  padding: 2rem;
}

.user-summary {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.user-avatar-large,
.avatar-placeholder-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder-large {
  background: linear-gradient(135deg, #fe4654, #404149);
  color: white;
  font-weight: 700;
  font-size: 2rem;
}

.user-summary-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #404149;
}

.user-email-large {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 1rem;
}

.user-type-badge.large {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.details-grid {
  display: grid;
  gap: 2rem;
}

.detail-section {
  background: #f8f7f3;
  border-radius: 1rem;
  padding: 1.5rem;
}

.detail-section h5 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #404149;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
}

.detail-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.detail-item .label {
  color: #666;
  font-weight: 500;
  min-width: 100px;
}

.detail-item .value {
  color: #404149;
  font-weight: 400;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
    margin: 1rem;
    padding: 2rem 1.5rem;
  }

  .header-stats {
    flex-direction: column;
    gap: 0.75rem;
  }

  .stat-badge {
    min-width: 100px;
    padding: 0.75rem 1rem;
  }

  .header-text h1 {
    font-size: 1.8rem;
  }

  .users-section {
    padding: 0 1rem;
  }

  .filters-container {
    flex-direction: column;
  }

  .users-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .user-summary {
    flex-direction: column;
    text-align: center;
  }

  .modal-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }

  .user-details-full {
    padding: 1rem;
  }

  .pagination {
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .pagination-btn,
  .pagination-number {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .user-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .detail-item {
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-item .value {
    text-align: left;
    max-width: 100%;
  }
}
</style>
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.clear-search:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.filters-container {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.9rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.3);
}

.filter-select option {
  background: #333;
  color: white;
}

/* Loading */
.loading-section {
  text-align: center;
  padding: 4rem 2rem;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Users Grid */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.user-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.user-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.2);
}

.user-avatar-container {
  position: relative;
  text-align: center;
  margin-bottom: 1rem;
}

.user-avatar,
.user-avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.user-avatar {
  object-fit: cover;
}

.user-avatar-placeholder {
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
}

.user-type-badge {
  position: absolute;
  top: -10px;
  right: calc(50% - 60px);
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.type-user {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.type-ente {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
}

.type-operatore {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: white;
}

.user-info {
  text-align: center;
}

.user-name {
  margin: 0 0 0.5rem 0;
  color: white;
  font-size: 1.3rem;
  font-weight: 600;
}

.user-email {
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  word-break: break-word;
}

.user-details {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: left;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.detail-value {
  color: white;
  font-weight: 400;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  flex: 1;
  justify-content: center;
}

.details-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.details-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.contact-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.contact-btn:hover {
  background: linear-gradient(135deg, #5a67d8, #6b46c1);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination-btn,
.pagination-number {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.pagination-btn:hover:not(:disabled),
.pagination-number:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-number.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.pagination-numbers {
  display: flex;
  gap: 0.5rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: white;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.user-modal {
  color: white;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.user-details-full {
  padding: 2rem;
}

.user-summary {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.user-avatar-large,
.avatar-placeholder-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder-large {
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
  color: white;
  font-weight: 700;
  font-size: 2rem;
}

.user-summary-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.user-email-large {
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
}

.user-type-badge.large {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.details-grid {
  display: grid;
  gap: 2rem;
}

.detail-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 1.5rem;
}

.detail-section h5 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.detail-item .label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  min-width: 100px;
}

.detail-item .value {
  color: white;
  font-weight: 400;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

/* Responsive */
@media (max-width: 768px) {
  .users-panel {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 1.5rem;
  }

  .header-text h1 {
    font-size: 2rem;
  }

  .filters-container {
    flex-direction: column;
  }

  .users-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .user-summary {
    flex-direction: column;
    text-align: center;
  }

  .modal-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }

  .user-details-full {
    padding: 1rem;
  }

  .pagination {
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .pagination-btn,
  .pagination-number {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .detail-item {
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-item .value {
    text-align: left;
    max-width: 100%;
  }

  .user-actions {
    flex-direction: column;
  }
}
  