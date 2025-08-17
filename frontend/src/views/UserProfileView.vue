<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { IUser } from '../types/User'
import type { IProposta } from '../types/Proposta'
import { getUserById } from '@/api/userApi'
import { getUserProposte } from '@/api/propostaApi'
import { useFollowStore } from '@/stores/followStore'
import { useUserStore } from '@/stores/userStore'

const route = useRoute()
const router = useRouter()
const followStore = useFollowStore()
const userStore = useUserStore()

const isLoading = ref(true)
const isLoadingProposte = ref(true)
const isFollowLoading = ref(false)
const user = ref<IUser | null>(null)
const userProposte = ref<IProposta[]>([])
const error = ref<string | null>(null)

const userId = computed(() => route.params.id as string)

// Computed per verificare se l'utente corrente può seguire questo profilo
const canFollow = computed(() => {
  return userStore.user && userStore.user._id !== userId.value
})

// Computed per lo stato del follow
const isFollowing = computed(() => {
  if (!userId.value) return false
  return followStore.isFollowing(userId.value)
})

// Computed per le statistiche aggiornate
const followersCount = computed(() => {
  const status = followStore.getFollowStatus(userId.value)
  return status?.followersCount ?? user.value?.followers ?? 0
})

const followingCount = computed(() => {
  const status = followStore.getFollowStatus(userId.value)
  return status?.followingCount ?? user.value?.following ?? 0
})

// Funzione per processare l'immagine del profilo
function processUserProfileImage(foto: any): string {
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

// Funzione per processare l'immagine delle proposte
function processPropostaImage(foto: any): string {
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
    console.error('Errore nella conversione dell\'immagine proposta:', e);
  }
  
  return '';
}

// Funzione per ottenere l'etichetta della categoria
function getCategoryLabel(categoria: string) {
  const categories: Record<string, string> = {
    cultura: '🎭 Cultura',
    concerti: '🎵 Concerti',
    mostreInstallazioni: '🖼️ Mostre e installazioni',
    sport: '⚽ Sport',
    workshopCorsi: '📚 Workshop e corsi',
    conferenze: '🎤 Conferenze'
  }
  return categories[categoria] || categoria
}

// Funzione per navigare al dettaglio della proposta
const goToProposta = (propostaId: string) => {
  router.push(`/proposte/${propostaId}`)
}

const fetchUserProfile = async () => {
  if (!userId.value) {
    error.value = 'ID utente non valido'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    error.value = null
    
    // Carica dati utente e proposte in parallelo
    const [userData, proposteData] = await Promise.all([
      getUserById(userId.value),
      getUserProposte(userId.value)
    ])
    
    user.value = userData
    userProposte.value = proposteData

    // Carica lo status di follow se l'utente è loggato
    if (userStore.user && userId.value !== userStore.user._id) {
      await followStore.loadFollowStatus(userId.value)
    }
  } catch (err: any) {
    console.error('Errore nel recupero del profilo utente:', err)
    error.value = err.message || 'Errore nel caricamento del profilo'
  } finally {
    isLoading.value = false
    isLoadingProposte.value = false
  }
}

// Funzione per gestire il follow/unfollow
const toggleFollow = async () => {
  if (!userId.value || !userStore.user) return
  
  try {
    isFollowLoading.value = true
    
    if (isFollowing.value) {
      await followStore.unfollowUser(userId.value)
    } else {
      await followStore.followUser(userId.value)
    }
  } catch (err: any) {
    console.error('Errore nel follow/unfollow:', err)
    // Potresti voler mostrare un messaggio di errore all'utente
  } finally {
    isFollowLoading.value = false
  }
}

onMounted(() => {
  fetchUserProfile()
})
</script>

<template>
  <div class="user-profile-container">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Caricamento profilo...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>Errore nel caricamento</h3>
      <p>{{ error }}</p>
      <button @click="fetchUserProfile" class="retry-btn">
        🔄 Riprova
      </button>
    </div>

    <!-- User profile -->
    <div v-else-if="user" class="user-profile">
      <!-- Header del profilo -->
      <div class="profile-header">
        <div class="profile-image-container">
          <img
            v-if="user.fotoProfilo"
            :src="processUserProfileImage(user.fotoProfilo)"
            alt="Foto profilo"
            class="profile-image"
          />
          <div v-else class="profile-image-placeholder">
            <span class="placeholder-icon">👤</span>
          </div>
        </div>

        <div class="profile-info">
          <h1 class="profile-name">
            {{ `${user.nome || ''} ${user.cognome || ''}`.trim() || 'Utente' }}
          </h1>
          
          <p v-if="user.credenziali?.email" class="profile-email">
            {{ user.credenziali.email }}
          </p>
          
          <p v-if="user.biografia" class="profile-bio">
            {{ user.biografia }}
          </p>

          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-number">{{ followersCount }}</span>
              <span class="stat-label">Follower</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ followingCount }}</span>
              <span class="stat-label">Following</span>
            </div>
          </div>

          <!-- Bottone Follow/Unfollow -->
          <div v-if="canFollow" class="follow-section">
            <button 
              @click="toggleFollow"
              :disabled="isFollowLoading"
              :class="['follow-btn', { 
                'following': isFollowing,
                'loading': isFollowLoading 
              }]"
            >
              <span v-if="isFollowLoading" class="btn-spinner"></span>
              <span v-else>
                {{ isFollowing ? '✓ Seguito' : '+ Segui' }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Proposte dell'utente -->
      <div class="profile-content">
        <div class="section-header">
          <h3>📝 Proposte dell'utente</h3>
          <p class="section-subtitle">
            {{ userProposte.length > 0 ? 
              `${userProposte.length} proposta${userProposte.length !== 1 ? 'e' : ''} approvata${userProposte.length !== 1 ? 'e' : ''}` : 
              'Nessuna proposta pubblicata' 
            }}
          </p>
        </div>

        <div v-if="isLoadingProposte" class="loading-proposte">
          <div class="loading-spinner"></div>
          <p>Caricamento proposte...</p>
        </div>

        <div v-else-if="userProposte.length === 0" class="empty-proposte">
          <div class="empty-icon">📝</div>
          <h4>Nessuna proposta ancora</h4>
          <p>Questo utente non ha ancora pubblicato proposte approvate</p>
        </div>

        <div v-else class="proposte-grid">
          <div
            v-for="proposta in userProposte"
            :key="proposta._id"
            class="proposta-card"
            @click="goToProposta(proposta._id)"
          >
            <div class="proposta-image-container">
              <img
                v-if="proposta.foto"
                :src="processPropostaImage(proposta.foto)"
                alt="Immagine proposta"
                class="proposta-img"
              />
              <div v-else class="proposta-img-placeholder">
                <span class="placeholder-icon">�</span>
              </div>
              
              <!-- Badge categoria -->
              <div v-if="proposta.categoria" class="categoria-badge">
                {{ getCategoryLabel(proposta.categoria) }}
              </div>
              
              <!-- Badge hyper count -->
              <div class="hyper-badge">
                <span class="hyper-icon">⚡</span>
                <span class="hyper-count">{{ proposta.listaHyper?.length || 0 }}</span>
              </div>
            </div>
            
            <div class="proposta-content">
              <h4 class="proposta-title">{{ proposta.titolo }}</h4>
              <p class="proposta-description">
                {{ proposta.descrizione.substring(0, 120) }}{{ proposta.descrizione.length > 120 ? '...' : '' }}
              </p>
              
              <div class="proposta-footer">
                <div class="proposta-meta">
                  <span v-if="proposta.luogo?.citta" class="meta-item">
                    <span class="meta-icon">📍</span>
                    {{ proposta.luogo.citta }}
                  </span>
                  <span class="meta-item">
                    <span class="meta-icon">📅</span>
                    {{ new Date(proposta.createdAt).toLocaleDateString('it-IT') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User not found -->
    <div v-else class="not-found-container">
      <div class="not-found-icon">👤</div>
      <h3>Utente non trovato</h3>
      <p>L'utente che stai cercando non esiste o è stato rimosso</p>
      <RouterLink to="/" class="back-btn">
        🏠 Torna alla home
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.user-profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.loading-container,
.error-container,
.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  background: var(--color-card-background);
  border-radius: 1.5rem;
  box-shadow: 0 4px 20px var(--color-shadow);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.not-found-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.retry-btn,
.back-btn {
  display: inline-block;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.retry-btn:hover,
.back-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px var(--color-primary-light);
}

.user-profile {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-header {
  background: var(--color-card-background);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 4px 20px var(--color-shadow);
  display: flex;
  gap: 2rem;
  align-items: center;
}

.profile-image-container {
  flex-shrink: 0;
}

.profile-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--color-border);
  box-shadow: 0 4px 20px var(--color-shadow);
}

.profile-image-placeholder {
  width: 120px;
  height: 120px;
  background: var(--color-background-mute);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--color-text-secondary);
  border: 4px solid var(--color-border);
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
}

.profile-email {
  color: var(--color-text-secondary);
  font-size: 1rem;
  margin: 0 0 1rem 0;
}

.profile-bio {
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
}

.profile-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.follow-section {
  margin-top: 0.5rem;
}

.follow-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 2rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 120px;
  position: relative;
}

.follow-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px var(--color-primary-light);
}

.follow-btn.following {
  background: #22c55e;
  border: 2px solid #22c55e;
}

.follow-btn.following:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}

.follow-btn.following:hover:not(:disabled) span {
  content: '✕ Smetti di seguire';
}

.follow-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.profile-content {
  background: var(--color-card-background);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 4px 20px var(--color-shadow);
}

.section-header {
  margin-bottom: 2rem;
}

.section-header h3 {
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
}

.section-subtitle {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 0.9rem;
}

.loading-proposte {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}

.empty-proposte {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--color-text-secondary);
}

.empty-proposte .empty-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-proposte h4 {
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}

.proposte-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.proposta-card {
  background: var(--color-background-soft);
  border-radius: 1.2rem;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid var(--color-border);
}

.proposta-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px var(--color-shadow-hover);
  border-color: var(--color-primary);
}

.proposta-image-container {
  position: relative;
  height: 200px;
}

.proposta-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.proposta-img-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-background-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--color-text-secondary);
}

.categoria-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.hyper-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--color-primary);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.proposta-content {
  padding: 1.5rem;
}

.proposta-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 0.8rem 0;
  line-height: 1.3;
}

.proposta-description {
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.proposta-footer {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.proposta-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
}

.meta-icon {
  font-size: 0.9rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .user-profile-container {
    padding: 0.5rem;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
    padding: 1.5rem;
  }
  
  .profile-image,
  .profile-image-placeholder {
    width: 100px;
    height: 100px;
  }
  
  .profile-name {
    font-size: 1.5rem;
  }
  
  .profile-stats {
    justify-content: center;
    gap: 3rem;
  }
}
</style>
