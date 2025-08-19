<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAllCommenti } from '@/api/commentiApi'
import { deleteCommento } from '@/api/propostaApi'
import { useUserStore } from '@/stores/userStore'
import { useModal } from '@/composables/useModal'
import { useRouter } from 'vue-router'

const loading = ref(true)
const error = ref('')
const commenti = ref<any[]>([])
const search = ref('')
const userStore = useUserStore()
const router = useRouter()
const { showConfirm, showError } = useModal()

// Verifica che l'utente sia operatore
const isOperatore = computed(() => userStore.isOperatore)

// Reindirizza se l'utente non ha i permessi
onMounted(() => {
  if (!isOperatore.value) {
    showError('Accesso Negato', 'Solo gli operatori possono accedere a questa sezione')
    router.push('/')
    return
  }
  caricaCommenti()
})

// Filtra commenti in base alla ricerca
const filteredCommenti = computed(() => {
  if (!search.value) return commenti.value
  
  const searchLower = search.value.toLowerCase()
  return commenti.value.filter(commento => 
    commento.contenuto.toLowerCase().includes(searchLower) ||
    commento.utente?.nome?.toLowerCase().includes(searchLower) ||
    commento.proposta?.titolo?.toLowerCase().includes(searchLower)
  )
})

async function eliminaCommento(commento: any) {
  const conferma = await showConfirm('Elimina commento', 'Sei sicuro di voler eliminare questo commento?')
  if (!conferma) return
  
  try {
    await deleteCommento(commento.proposta?._id, commento._id, userStore.token)
    commenti.value = commenti.value.filter(c => c._id !== commento._id)
  } catch (err: any) {
    console.error('Errore eliminazione commento:', err)
    showError('Errore', err.message || 'Errore nella cancellazione del commento')
  }
}

async function caricaCommenti() {
  try {
    loading.value = true
    error.value = ''
    commenti.value = await getAllCommenti()
  } catch (err: any) {
    console.error('Errore caricamento commenti:', err)
    error.value = err.message || 'Errore nel caricamento dei commenti'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="comments-moderation-view">
    <!-- Header della pagina -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">💬</div>
        <div class="header-text">
          <h1>Tutti i Commenti</h1>
          <p>Visualizza e gestisci tutti i commenti del sistema</p>
        </div>
      </div>
      <div class="header-stats" v-if="!loading">
        <div class="stat-badge">
          <span class="stat-number">{{ filteredCommenti.length }}</span>
          <span class="stat-label">{{ filteredCommenti.length === 1 ? 'Commento' : 'Commenti' }}</span>
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
          placeholder="Cerca commenti per contenuto, utente o proposta..."
        />
        <div v-if="search" class="clear-search" @click="search = ''">✕</div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Caricamento commenti...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-section">
      <div class="error-icon">⚠️</div>
      <h3>Errore nel caricamento</h3>
      <p>{{ error }}</p>
      <button @click="caricaCommenti" class="retry-btn">Riprova</button>
    </div>

    <!-- Lista commenti -->
    <div v-else class="comments-section">
      <div v-if="filteredCommenti.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>{{ search ? 'Nessun commento trovato' : 'Nessun commento presente' }}</h3>
        <p v-if="search">Prova a modificare i criteri di ricerca</p>
      </div>
      
      <div v-else class="comments-grid">
        <div v-for="commento in filteredCommenti" :key="commento._id" class="comment-card">
          <!-- Header del commento -->
          <div class="comment-header">
            <div class="comment-user-info">
              <div class="user-avatar">
                <span>{{ commento.utente?.nome?.charAt(0) || 'U' }}</span>
              </div>
              <div class="user-details">
                <span class="user-name">{{ commento.utente?.nome || 'Utente' }}</span>
                <span class="comment-date">{{ new Date(commento.dataOra).toLocaleString('it-IT') }}</span>
              </div>
            </div>
            <button 
              class="delete-comment-btn" 
              @click="eliminaCommento(commento)" 
              title="Elimina commento"
            >
              🗑️
            </button>
          </div>

          <!-- Contenuto del commento -->
          <div class="comment-content">{{ commento.contenuto }}</div>

          <!-- Link alla proposta -->
          <div class="comment-proposta-link">
            <strong>Proposta:</strong>
            <template v-if="commento.proposta?._id">
              <router-link
                :to="`/proposte/${commento.proposta._id}`"
                class="proposta-link"
              >
                {{ commento.proposta.titolo }}
              </router-link>
            </template>
            <template v-else>
              <span class="proposta-unknown">Sconosciuta</span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comments-moderation-view {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}
.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.header-icon {
  font-size: 2.5rem;
  color: #fe4654;
}
.header-text h1 {
  font-size: 2.5rem;
  margin: 0;
  color: #404149;
}
.header-text p {
  font-size: 1rem;
  color: #666;
  margin-top: 0.5rem;
}
.header-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.stat-badge {
  background: #f0f0f0;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #333;
}
.stat-number {
  font-weight: bold;
  font-size: 1.1rem;
  color: #fe4654;
}
.search-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}
.search-container {
  position: relative;
  display: flex;
  align-items: center;
  background: #f0f0f0;
  border-radius: 10px;
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
}
.search-icon {
  font-size: 1.2rem;
  color: #666;
  margin-right: 0.5rem;
}
.search-input {
  flex-grow: 1;
  border: none;
  background: none;
  padding: 0.5rem 0;
  font-size: 1rem;
  color: #333;
}
.search-input:focus {
  outline: none;
}
.clear-search {
  position: absolute;
  right: 10px;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 50%;
  background: #f0f0f0;
  border: 1px solid #ccc;
}
.clear-search:hover {
  background: #e0e0e0;
}
.comments-section {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.comments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}
.comment-card {
  background: #f8f7f3;
  border-radius: 0.8rem;
  padding: 1.2rem 1rem;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  position: relative;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid #eee;
}
.comment-user-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.user-avatar {
  width: 30px;
  height: 30px;
  background: #fe4654;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
}
.user-details {
  display: flex;
  flex-direction: column;
}
.user-name {
  font-weight: 600;
  color: #333;
}
.comment-date {
  font-size: 0.8rem;
  color: #666;
}
.delete-comment-btn {
  background: none;
  border: none;
  color: #fe4654;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
  border: 1px solid;
}
.delete-comment-btn:hover {
  background: #ffeaea;
}
.comment-content {
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
  color: #222;
  line-height: 1.5;
}
.comment-proposta-link {
  font-size: 0.9rem;
  color: #fe4654;
  text-decoration: underline;
  font-weight: 600;
  transition: color 0.2s, transform 0.2s;
  cursor: pointer;
  display: inline-block;
}
.comment-proposta-link:hover, .comment-proposta-link:focus {
  color: #b8001c;
  transform: scale(1.04);
  outline: none;
  box-shadow: none;
}

.comment-proposta-link:focus,
.comment-proposta-link:focus-visible,
.comment-proposta-link:active {
  outline: none !important;
  box-shadow: none !important;
}
.proposta-unknown {
  color: #666;
  font-style: italic;
}
.loading-section, .error-section, .empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
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
.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}
.retry-btn {
  background-color: #fe4654;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 0.8rem;
  border: none;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.2);
}
.retry-btn:hover {
  background-color: #b8001c;
}
</style>
