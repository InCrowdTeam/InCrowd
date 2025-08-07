<template>
  <div class="moderation-panel">
    <!-- Header della pagina -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">🔍</div>
        <div class="header-text">
          <h1>Moderazione Proposte</h1>
          <p>Revisiona e gestisci le proposte in attesa di approvazione</p>
        </div>
      </div>
      <div class="header-stats" v-if="!loading">
        <div class="stat-badge">
          <span class="stat-number">{{ filteredProposte.length }}</span>
          <span class="stat-label">{{ filteredProposte.length === 1 ? 'Proposta' : 'Proposte' }}</span>
        </div>
      </div>
    </div>

    <!-- Barra di ricerca -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-icon">🔍</div>
        <input
          class="search-input"
          type="text"
          v-model="search"
          placeholder="Cerca proposte per titolo o descrizione..."
        />
        <div v-if="search" class="clear-search" @click="search = ''">✕</div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Caricamento proposte...</p>
    </div>

    <!-- Lista proposte -->
    <div v-else-if="filteredProposte.length" class="proposals-section">
      <div class="proposals-grid">
        <div
          v-for="proposta in filteredProposte"
          :key="proposta.titolo"
          class="proposal-card"
        >
          <!-- Immagine proposta -->
          <div class="proposal-image-container">
            <img 
              v-if="proposta.foto?.data"
              :src="`data:${proposta.foto.contentType};base64,${proposta.foto.data}`"
              class="proposal-image"
              alt="Immagine proposta" 
            />
            <div v-else class="proposal-image-placeholder">
              <span>📸</span>
            </div>
          </div>

          <!-- Contenuto proposta -->
          <div class="proposal-content">
            <div class="proposal-header">
              <h3 class="proposal-title">{{ proposta.titolo }}</h3>
              <div class="proposal-status">
                <span class="status-badge pending">In attesa</span>
              </div>
            </div>

            <p class="proposal-description">{{ proposta.descrizione }}</p>

            <!-- Dettagli -->
            <div class="proposal-details">
              <div class="detail-item">
                <span class="detail-label">Categoria:</span>
                <span class="detail-value">{{ proposta.categoria || 'Generale' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Data:</span>
                <span class="detail-value">{{ new Date(proposta.createdAt).toLocaleDateString('it-IT') }}</span>
              </div>
              <div class="detail-item" v-if="proposta.luogo">
                <span class="detail-label">Luogo:</span>
                <span class="detail-value">{{ proposta.luogo.citta }}</span>
              </div>
            </div>

            <!-- Azioni di moderazione -->
            <div class="moderation-actions">
              <button 
                @click="approveProposal(proposta)" 
                class="action-btn approve-btn"
                title="Approva proposta"
              >
                <span class="btn-icon">✅</span>
                <span class="btn-text">Approva</span>
              </button>
              <button 
                @click="rejectProposal(proposta)" 
                class="action-btn reject-btn"
                title="Rifiuta proposta"
              >
                <span class="btn-icon">❌</span>
                <span class="btn-text">Rifiuta</span>
              </button>
              <button 
                @click="viewDetails(proposta)" 
                class="action-btn details-btn"
                title="Visualizza dettagli"
              >
                <span class="btn-icon">👁️</span>
                <span class="btn-text">Dettagli</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <div class="empty-icon">🎉</div>
      <h3>{{ search ? 'Nessuna proposta trovata' : 'Tutto moderato!' }}</h3>
      <p>{{ search ? 'Prova a modificare i termini di ricerca' : 'Non ci sono proposte in attesa di moderazione' }}</p>
    </div>

    <!-- Modal per commento di rifiuto -->
    <div v-if="showRejectModal" class="modal-overlay" @click="closeRejectModal">
      <div class="modal-content" @click.stop>
        <h3>Rifiuta Proposta</h3>
        <p>Stai per rifiutare la proposta: <strong>{{ selectedProposal?.titolo }}</strong></p>
        <div class="form-group">
          <label for="reject-comment">Motivo del rifiuto (opzionale):</label>
          <textarea
            id="reject-comment"
            v-model="rejectComment"
            placeholder="Spiega il motivo del rifiuto..."
            rows="3"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button @click="closeRejectModal" class="btn-secondary">Annulla</button>
          <button @click="confirmReject" class="btn-danger">Rifiuta Proposta</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { getPendingProposte, changePropostaState } from '@/api/propostaApi'

const store = useUserStore()
const proposte = ref<any[]>([])
const search = ref('')
const loading = ref(true)
const showRejectModal = ref(false)
const selectedProposal = ref<any>(null)
const rejectComment = ref('')

const fetchProposte = async () => {
  try {
    loading.value = true
    const data = await getPendingProposte(store.token)
    proposte.value = data
  } catch (error) {
    console.error('Errore nel caricamento proposte:', error)
  } finally {
    loading.value = false
  }
}

const changeState = async (titolo: string, stato: string, commento: string = '') => {
  try {
    await changePropostaState(titolo, stato, store.token, commento)
    // Rimuovi la proposta dalla lista
    proposte.value = proposte.value.filter(p => p.titolo !== titolo)
  } catch (error) {
    console.error('Errore nell\'aggiornamento stato:', error)
    alert('Errore nell\'aggiornamento dello stato della proposta')
  }
}

const approveProposal = async (proposta: any) => {
  if (confirm(`Sei sicuro di voler approvare "${proposta.titolo}"?`)) {
    await changeState(proposta.titolo, 'approvata', 'Proposta approvata dall\'operatore')
  }
}

const rejectProposal = (proposta: any) => {
  selectedProposal.value = proposta
  showRejectModal.value = true
}

const confirmReject = async () => {
  if (selectedProposal.value) {
    await changeState(
      selectedProposal.value.titolo, 
      'rifiutata', 
      rejectComment.value || 'Proposta rifiutata dall\'operatore'
    )
    closeRejectModal()
  }
}

const closeRejectModal = () => {
  showRejectModal.value = false
  selectedProposal.value = null
  rejectComment.value = ''
}

const viewDetails = (proposta: any) => {
  // Per ora mostra un alert con i dettagli, in futuro si può implementare un modal dettagliato
  alert(`Dettagli Proposta:\n\nTitolo: ${proposta.titolo}\nDescrizione: ${proposta.descrizione}\nCategoria: ${proposta.categoria || 'Non specificata'}\nData: ${new Date(proposta.createdAt).toLocaleDateString('it-IT')}`)
}

onMounted(fetchProposte)

const filteredProposte = computed(() => {
  const q = search.value.toLowerCase()
  return proposte.value.filter(p =>
    p.titolo.toLowerCase().includes(q) ||
    p.descrizione.toLowerCase().includes(q)
  )
})
</script>

<style scoped>
.moderation-panel {
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
}

.stat-badge {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  min-width: 120px;
}

.stat-number {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.9;
  font-weight: 500;
}

/* Search */
.search-section {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.search-container {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 1.1rem;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid transparent;
  border-radius: 2rem;
  background: #fff;
  font-size: 1rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #fe4654;
  box-shadow: 0 4px 20px rgba(254, 70, 84, 0.2);
}

.clear-search {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 50%;
  transition: all 0.2s;
}

.clear-search:hover {
  background: #f0f0f0;
  color: #fe4654;
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

/* Proposals */
.proposals-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.proposals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 2rem;
}

.proposal-card {
  background: #fff;
  border-radius: 1.2rem;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.proposal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

.proposal-image-container {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f8f7f3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.proposal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.proposal-image-placeholder {
  color: #999;
  font-size: 2.5rem;
}

.proposal-content {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.proposal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.proposal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #404149;
  margin: 0;
  line-height: 1.3;
  flex: 1;
}

.proposal-status {
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

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.proposal-description {
  color: #666;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
  flex: 1;
}

.proposal-details {
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
.moderation-actions {
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

.approve-btn {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.approve-btn:hover {
  background: #c3e6cb;
  transform: translateY(-1px);
}

.reject-btn {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.reject-btn:hover {
  background: #f5c6cb;
  transform: translateY(-1px);
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

.btn-icon {
  font-size: 1rem;
}

/* Empty state */
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
}

.empty-state h3 {
  color: #404149;
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #666;
  margin: 0;
  font-size: 1.1rem;
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
  padding: 2rem;
  border-radius: 1.2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  color: #404149;
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
}

.modal-content p {
  color: #666;
  margin: 0 0 1.5rem 0;
  line-height: 1.4;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #404149;
}

.form-group textarea {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 0.8rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-group textarea:focus {
  outline: none;
  border-color: #fe4654;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-secondary, .btn-danger {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 0.8rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #6c757d;
  color: #fff;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: #fff;
}

.btn-danger:hover {
  background: #c82333;
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

  .proposals-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .search-section {
    padding: 1.5rem 1rem;
  }

  .proposals-section {
    padding: 0 1rem;
  }

  .moderation-actions {
    flex-direction: column;
  }

  .modal-content {
    margin: 1rem;
    width: auto;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
