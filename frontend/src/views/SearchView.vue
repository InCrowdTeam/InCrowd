<template>
  <div class="search-view">
    <!-- Header -->
    <div class="search-header">
      <div class="container">
        <h1 class="page-title">🔍 Ricerca Proposte</h1>
        <p class="page-subtitle">Trova le proposte che ti interessano di più</p>
      </div>
    </div>

    <!-- Contenuto principale -->
    <div class="container">
      <SearchProposte @selectProposta="handleSelectProposta" />
    </div>

    <!-- Side panel per dettagli proposta -->
    <Transition name="slide-panel">
      <div
        v-if="selectedProposta"
        class="side-panel"
        :class="{ 'side-panel--open': selectedProposta }"
      >
        <button class="close-btn" @click="closeProposta">×</button>
        
        <!-- Header della proposta -->
        <div class="proposal-header-card">
          <img
            v-if="selectedProposta.foto"
            :src="`data:${selectedProposta.foto.contentType};base64,${selectedProposta.foto.data}`"
            alt="Immagine proposta"
            class="proposal-image"
          />
          <div v-else class="proposal-image-placeholder">
            <span>📸</span>
          </div>
          
          <div class="proposal-info">
            <h2 class="proposal-title">{{ selectedProposta.titolo }}</h2>
            <span class="proposal-category-badge">{{ selectedProposta.categoria }}</span>
            <p class="proposal-description">{{ selectedProposta.descrizione }}</p>
          </div>
        </div>

        <!-- Informazioni aggiuntive -->
        <div class="proposal-details">
          <!-- Statistiche -->
          <div class="detail-section">
            <h3 class="detail-title">📊 Statistiche</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-icon">⚡</span>
                <div class="stat-content">
                  <span class="stat-number">{{ selectedProposta.listaHyper?.length || 0 }}</span>
                  <span class="stat-label">Hyper</span>
                </div>
              </div>
              <div class="stat-item">
                <span class="stat-icon">📅</span>
                <div class="stat-content">
                  <span class="stat-number">{{ formatDate(selectedProposta.createdAt) }}</span>
                  <span class="stat-label">Creata il</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Luogo -->
          <div v-if="selectedProposta.luogo" class="detail-section">
            <h3 class="detail-title">📍 Luogo</h3>
            <div class="location-info">
              <p>{{ formatLocation(selectedProposta.luogo) }}</p>
            </div>
          </div>

          <!-- Data ipotetica -->
          <div v-if="selectedProposta.dataIpotetica" class="detail-section">
            <h3 class="detail-title">🗓️ Data prevista</h3>
            <div class="date-info">
              <p>{{ formatDate(selectedProposta.dataIpotetica) }}</p>
            </div>
          </div>

          <!-- Stato -->
          <div class="detail-section">
            <h3 class="detail-title">🔄 Stato</h3>
            <div class="status-info">
              <span class="status-badge" :class="`status-${selectedProposta.stato?.stato}`">
                {{ formatStatus(selectedProposta.stato?.stato) }}
              </span>
              <p v-if="selectedProposta.stato?.commento" class="status-comment">
                {{ selectedProposta.stato.commento }}
              </p>
            </div>
          </div>
        </div>

        <!-- Azioni -->
        <div v-if="userStore.user" class="proposal-actions">
          <button 
            v-if="canHype"
            @click="handleHyper"
            :disabled="isHyperLoading"
            class="action-btn hyper-btn"
            :class="{ active: isUserHyped }"
          >
            <span v-if="!isHyperLoading">⚡</span>
            <span v-else>⏳</span>
            {{ isUserHyped ? 'Rimuovi Hyper' : 'Metti Hyper' }}
          </button>
          
          <button 
            @click="openComments"
            class="action-btn comments-btn"
          >
            💬 Commenti
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import SearchProposte from '@/components/SearchProposte.vue'
import { toggleHyperProposta } from '@/api/propostaApi'
import { useModal } from '@/composables/useModal'

// Store
const userStore = useUserStore()
const { showError, showInfo } = useModal()

// Stato reattivo
const selectedProposta = ref<any>(null)
const isHyperLoading = ref(false)

// Computed
const canHype = computed(() => {
  return userStore.user && 
         userStore.user.userType !== 'operatore' &&
         selectedProposta.value &&
         selectedProposta.value.proponenteID !== userStore.user._id
})

const isUserHyped = computed(() => {
  if (!selectedProposta.value || !userStore.user) return false
  return selectedProposta.value.listaHyper?.includes(userStore.user._id) || false
})

// Metodi
const handleSelectProposta = (proposta: any) => {
  selectedProposta.value = proposta
}

const closeProposta = () => {
  selectedProposta.value = null
}

const handleHyper = async () => {
  if (!canHype.value || !selectedProposta.value || isHyperLoading.value) return
  
  isHyperLoading.value = true
  
  try {
    const updatedProposta = await toggleHyperProposta(
      selectedProposta.value.titolo,
      userStore.token
    )
    
    selectedProposta.value = updatedProposta
    
  } catch (error: any) {
    console.error('Errore hyper:', error)
    if (error.response?.status === 401) {
      showError('Sessione scaduta', 'Effettua nuovamente il login.');
    } else if (error.response?.status === 403) {
      showError('Permessi insufficienti', 'Non hai il permesso di mettere hyper.');
    } else {
      showError('Errore nell\'aggiunta dell\'hyper', error.message);
    }
  } finally {
    isHyperLoading.value = false
  }
}

const openComments = () => {
  // TODO: Implementare apertura pannello commenti
  showInfo('Funzionalità in sviluppo', 'Funzionalità commenti in arrivo!')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatLocation = (luogo: any) => {
  const parts = []
  if (luogo.via) parts.push(luogo.via)
  if (luogo.civico) parts.push(luogo.civico)
  if (luogo.citta) parts.push(luogo.citta)
  if (luogo.cap) parts.push(luogo.cap)
  return parts.join(', ')
}

const formatStatus = (stato: string) => {
  const statuses: Record<string, string> = {
    approvata: '✅ Approvata',
    in_approvazione: '⏳ In approvazione',
    rifiutata: '❌ Rifiutata'
  }
  return statuses[stato] || stato
}
</script>

<style scoped>
.search-view {
  min-height: 100vh;
  background: #f8f7f3;
  padding-bottom: 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Header */
.search-header {
  background: linear-gradient(135deg, #fe4654, #404149);
  color: #fff;
  padding: 3rem 0;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.page-subtitle {
  font-size: 1.2rem;
  margin: 0;
  text-align: center;
  opacity: 0.9;
}

/* Side Panel */
.side-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: #fff;
  box-shadow: -4px 0 20px rgba(0,0,0,0.15);
  z-index: 1000;
  padding: 2rem;
  overflow-y: auto;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.side-panel--open {
  transform: translateX(0);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background-color: #f0f0f0;
}

/* Proposal Header */
.proposal-header-card {
  margin-bottom: 2rem;
}

.proposal-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 1rem;
  margin-bottom: 1rem;
}

.proposal-image-placeholder {
  width: 100%;
  height: 200px;
  background: #f0f0f0;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  margin-bottom: 1rem;
}

.proposal-info {
  text-align: center;
}

.proposal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #404149;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.proposal-category-badge {
  display: inline-block;
  background: #fe4654;
  color: #fff;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  margin-bottom: 1rem;
}

.proposal-description {
  color: #666;
  line-height: 1.5;
  margin: 0;
}

/* Proposal Details */
.proposal-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.detail-section {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
}

.detail-title {
  font-size: 1rem;
  font-weight: 600;
  color: #404149;
  margin: 0 0 1rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-icon {
  font-size: 1.2rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-weight: 600;
  color: #404149;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

.location-info,
.date-info {
  color: #666;
}

.location-info p,
.date-info p {
  margin: 0;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  width: fit-content;
}

.status-approvata {
  background: #d4edda;
  color: #155724;
}

.status-in_approvazione {
  background: #fff3cd;
  color: #856404;
}

.status-rifiutata {
  background: #f8d7da;
  color: #721c24;
}

.status-comment {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
  font-style: italic;
}

/* Proposal Actions */
.proposal-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.action-btn {
  padding: 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.hyper-btn {
  background: #fe4654;
  color: #fff;
}

.hyper-btn:hover:not(:disabled) {
  background: #e63946;
}

.hyper-btn.active {
  background: #28a745;
}

.hyper-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.comments-btn {
  background: #6c757d;
  color: #fff;
}

.comments-btn:hover {
  background: #5a6268;
}

/* Animazioni */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: all 0.3s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .page-subtitle {
    font-size: 1rem;
  }
  
  .side-panel {
    width: 100%;
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .search-header {
    padding: 2rem 0;
  }
}
</style>
