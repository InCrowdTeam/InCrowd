<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'
import { getOperatoreStats } from '@/api/operatoreApi'

const userStore = useUserStore()
const router = useRouter()

// Se non è operatore, reindirizza
if (userStore.userType !== 'operatore') {
  router.push('/')
}

const stats = ref({
  proposteInAttesa: 0,
  proposteApprovate: 0,
  proposteRifiutate: 0,
  utentiRegistrati: 0,
  entiRegistrati: 0,
  commentiTotali: 0,
  utentiTotali: 0
})

const loading = ref(true)
const error = ref('')

const reloadPage = () => {
  window.location.reload()
}

const goToModeration = () => {
  router.push('/moderation')
}

const goToUserManagement = () => {
  router.push('/users')
}

const goToCommentManagement = () => {
  router.push('/comments')
}

onMounted(async () => {
  try {
    loading.value = true
    
    const data = await getOperatoreStats(userStore.token)
    stats.value = data
  } catch (err: any) {
    console.error('Errore nel caricamento statistiche:', err)
    error.value = err.message || 'Errore nel caricamento delle statistiche'
  } finally {
    loading.value = false
  }
})

</script>

<template>
  <div class="operator-panel">
    <!-- Header pannello -->
    <div class="panel-header">
      <div class="header-content">
        <div class="header-icon">🛡️</div>
        <div class="header-text">
          <h1>Pannello Operatore</h1>
          <p>Gestisci la comunità InCrowd e mantieni un ambiente sicuro per tutti</p>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Caricamento pannello operatore...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-section">
      <div class="error-icon">⚠️</div>
      <h3>Errore nel caricamento</h3>
      <p>{{ error }}</p>
      <button @click="reloadPage" class="retry-button">Riprova</button>
    </div>

    <!-- Contenuto principale -->
    <div v-else class="panel-content">
      
      <!-- Statistiche rapide -->
      <div class="stats-overview">
        <h2>Panoramica</h2>
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">⏳</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.proposteInAttesa }}</span>
              <span class="stat-title">Proposte in Attesa</span>
              <span class="stat-subtitle">Richiedono moderazione</span>
            </div>
          </div>

          <div class="stat-card success">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.proposteApprovate }}</span>
              <span class="stat-title">Proposte Approvate</span>
              <span class="stat-subtitle">Totale pubblicate</span>
            </div>
          </div>

          <div class="stat-card users">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.utentiTotali }}</span>
              <span class="stat-title">Utenti Registrati</span>
              <span class="stat-subtitle">Comunità totale</span>
            </div>
          </div>

          <div class="stat-card warning">
            <div class="stat-icon">❌</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.proposteRifiutate }}</span>
              <span class="stat-title">Proposte Rifiutate</span>
              <span class="stat-subtitle">Totale respinte</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Azioni principali -->
      <div class="main-actions">
        <h2>Strumenti Operatore</h2>
        <div class="actions-grid">
          
          <!-- Moderazione Proposte -->
          <div class="action-card featured" @click="goToModeration">
            <div class="action-header">
              <div class="action-icon">🔍</div>
              <div class="action-badge" v-if="stats.proposteInAttesa > 0">
                {{ stats.proposteInAttesa }}
              </div>
            </div>
            <div class="action-content">
              <h3>Moderazione Proposte</h3>
              <p>Revisiona, approva o rifiuta le proposte degli utenti. Mantieni la qualità dei contenuti della piattaforma.</p>
              <div class="action-metrics">
                <span class="metric">
                  <span class="metric-value">{{ stats.proposteInAttesa }}</span>
                  <span class="metric-label">in attesa</span>
                </span>
              </div>
            </div>
            <div class="action-footer">
              <span class="action-cta">Inizia Moderazione →</span>
            </div>
          </div>

          <!-- Gestione Utenti -->
          <div class="action-card" @click="goToUserManagement">
            <div class="action-header">
              <div class="action-icon">👥</div>
            </div>
            <div class="action-content">
              <h3>Gestione Utenti</h3>
              <p>Visualizza e gestisci la lista degli utenti registrati. Monitora l'attività della comunità.</p>
              <div class="action-metrics">
                <span class="metric">
                  <span class="metric-value">{{ stats.utentiTotali }}</span>
                  <span class="metric-label">utenti totali</span>
                </span>
              </div>
            </div>
            <div class="action-footer">
              <span class="action-cta">Visualizza Utenti →</span>
            </div>
          </div>

          <!-- Ultimi Commenti -->
          <div class="action-card" @click="goToCommentManagement">
            <div class="action-header">
              <div class="action-icon">💬</div>
            </div>
            <div class="action-content">
              <h3>Ultimi Commenti</h3>
              <p>Visualizza gli ultimi commenti inseriti dagli utenti su tutte le proposte.</p>
            </div>
            <div class="action-footer">
              <span class="action-cta">Visualizza Commenti →</span>
            </div>
          </div>



        </div>
      </div>



    </div>
  </div>
</template>

<style scoped>
.operator-panel {
  min-height: 100vh;
  background: #f8f7f3;
  padding-bottom: 2rem;
}

/* Header del pannello */
.panel-header {
  background: linear-gradient(135deg, #fe4654, #404149);
  color: #fff;
  padding: 2.5rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2rem 2rem 2rem 2rem;
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(254, 70, 84, 0.3);
  position: relative;
  overflow: hidden;
}

.panel-header::before {
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

/* Error state */
.error-section {
  text-align: center;
  padding: 4rem 2rem;
  background: #fff;
  margin: 2rem;
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-section h3 {
  color: #404149;
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
}

.error-section p {
  color: #666;
  margin: 0 0 1.5rem 0;
}

.retry-button {
  background: #fe4654;
  color: #fff;
  border: none;
  border-radius: 0.8rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover {
  background: #e63946;
  transform: translateY(-1px);
}

/* Contenuto */
.panel-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.panel-content h2 {
  color: #404149;
  font-size: 1.4rem;
  margin: 0 0 1.2rem 0;
  font-weight: 600;
}

/* Statistiche overview */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.2rem;
}

.stat-card {
  background: #fff;
  border-radius: 1.2rem;
  padding: 1.5rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
}

.stat-card.primary {
  border-left: 4px solid #fe4654;
}

.stat-card.success {
  border-left: 4px solid #28a745;
}

.stat-card.users {
  border-left: 4px solid #007bff;
}

.stat-card.warning {
  border-left: 4px solid #ffc107;
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #404149;
  display: block;
  margin-bottom: 0.3rem;
}

.stat-title {
  font-size: 1rem;
  font-weight: 600;
  color: #404149;
  display: block;
  margin-bottom: 0.2rem;
}

.stat-subtitle {
  font-size: 0.85rem;
  color: #666;
}

.stat-action {
  background: #fe4654;
  color: #fff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 0.6rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: auto;
}

.stat-action:hover {
  background: #e63946;
}

/* Azioni principali */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: #fff;
  border-radius: 1.2rem;
  padding: 0;
  box-shadow: 0 2px 20px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

.action-card.featured {
  background: linear-gradient(135deg, #fe4654, #ff6b7a);
  color: #fff;
}



.action-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.action-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.action-badge {
  background: rgba(255, 255, 255, 0.9);
  color: #fe4654;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 700;
}



.action-content {
  padding: 0 1.5rem;
  flex: 1;
}

.action-content h3 {
  font-size: 1.3rem;
  margin: 0 0 0.8rem 0;
  font-weight: 600;
  color: inherit;
}

.action-content p {
  margin: 0 0 1rem 0;
  line-height: 1.5;
  opacity: 0.9;
}

.action-metrics {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  min-width: 60px;
}

.action-card:not(.featured) .metric {
  background: #f8f7f3;
}

.metric-value {
  font-size: 1.2rem;
  font-weight: 700;
}

.metric-label {
  font-size: 0.75rem;
  opacity: 0.8;
}

.action-footer {
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  margin-top: auto;
}

.action-cta {
  font-weight: 600;
  opacity: 0.9;
}



/* Responsive */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
    margin: 1rem;
    padding: 2rem 1.5rem;
  }

  .panel-content {
    padding: 0 1rem;
    gap: 2rem;
  }

  .stats-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
