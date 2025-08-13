<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getUltimiCommenti } from '@/api/commentiApi'
import { deleteCommento } from '@/api/propostaApi'
import { useUserStore } from '@/stores/userStore'
import { useModal } from '@/composables/useModal'
const loading = ref(true)
const error = ref('')
const ultimiCommenti = ref<any[]>([])
const userStore = useUserStore()
const { showConfirm, showError } = useModal()

async function eliminaCommento(commento: any) {
  const conferma = await showConfirm('Elimina commento', 'Sei sicuro di voler eliminare questo commento?')
  if (!conferma) return
  try {
    await deleteCommento(commento.proposta?._id, commento._id, userStore.token)
    ultimiCommenti.value = ultimiCommenti.value.filter(c => c._id !== commento._id)
  } catch (err: any) {
    showError('Errore', err.message || 'Errore nella cancellazione del commento')
  }
}

onMounted(async () => {
  try {
    loading.value = true
    ultimiCommenti.value = await getUltimiCommenti(20)
  } catch (err: any) {
    error.value = err.message || 'Errore nel caricamento dei commenti'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="comments-view">
    <h1>Ultimi Commenti</h1>
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Caricamento commenti...</p>
    </div>
    <div v-else-if="error" class="error-section">
      <div class="error-icon">⚠️</div>
      <h3>Errore nel caricamento</h3>
      <p>{{ error }}</p>
    </div>
    <div v-else>
      <div v-if="ultimiCommenti.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>Nessun commento trovato</h3>
      </div>
      <div v-else class="comments-list">
        <div v-for="commento in ultimiCommenti" :key="commento._id" class="comment-card">
          <div class="comment-proposta-title">
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
              Sconosciuta
            </template>
          </div>
          <div class="comment-content">{{ commento.contenuto }}</div>
          <div class="comment-meta">
            <span class="comment-user">di {{ commento.utente?.nome || 'Utente' }}</span>
            <span class="comment-date">{{ new Date(commento.dataOra).toLocaleString('it-IT') }}</span>
            <button class="delete-comment-btn" @click="eliminaCommento(commento)" title="Elimina commento">
              🗑️Elimina commento
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.comments-view {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
}
.comments-view h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #404149;
}
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.comment-card {
  background: #f8f7f3;
  border-radius: 0.8rem;
  padding: 1.2rem 1rem;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  position: relative;
}
.comment-proposta-title {
  font-size: 1rem;
  color: #fe4654;
  margin-bottom: 0.5rem;
}
.comment-content {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #222;
}
.comment-meta {
  font-size: 0.95rem;
  color: #666;
  display: flex;
  gap: 1.2rem;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
}
.delete-comment-btn {
  background: none;
  border-color: #fe4654;
  border: none;
  color: #fe4654;
  font-size: 0.8rem;
  cursor: pointer;
  margin-left: auto;
  padding: 0.3rem 0.6rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
  border: 1px solid;
}
.delete-comment-btn:hover {
  background: #ffeaea;
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
</style>

<style scoped>
.proposta-link {
  color: #fe4654;
  text-decoration: underline;
  font-weight: 600;
  transition: color 0.2s, transform 0.2s;
  cursor: pointer;
  display: inline-block;
}
.proposta-link:hover, .proposta-link:focus {
  color: #b8001c;
  transform: scale(1.04);
  outline: none;
  box-shadow: none;
}

.proposta-link:focus,
.proposta-link:focus-visible,
.proposta-link:active {
  outline: none !important;
  box-shadow: none !important;
}
</style>
