<template>
  <div class="user-profile-container">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Caricamento profilo...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <h2>Errore</h2>
      <p class="error-message">{{ error }}</p>
      <button @click="$router.push('/')" class="btn-primary">Torna alla home</button>
    </div>

    <!-- User profile content -->
    <div v-else-if="userProfile" class="profile-content">
      <!-- Header del profilo -->
      <div class="profile-header">
        <div class="avatar-section">
          <img 
            v-if="fotoProfiloUrl" 
            :src="fotoProfiloUrl" 
            :alt="`Foto profilo di ${nomeCompleto}`"
            class="avatar"
          />
          <div v-else class="avatar-placeholder">
            {{ nomeCompleto.charAt(0).toUpperCase() }}
          </div>
        </div>
        
        <div class="profile-info">
          <div class="profile-name-section">
            <h1 class="nome-utente">{{ nomeCompleto }}</h1>
            <span class="user-type-badge" :class="getUserTypeClass()">{{ getUserTypeLabel() }}</span>
          </div>
          
          <!-- Messaggio se è il proprio profilo -->
          <div v-if="isOwnProfile" class="own-profile-notice">
            <i class="fas fa-info-circle"></i>
            Questo è il tuo profilo pubblico
            <router-link to="/profilo" class="edit-profile-link">Modifica profilo</router-link>
          </div>
          
          <p v-if="userProfile.biografia" class="profile-bio">{{ userProfile.biografia }}</p>
          <p v-else class="profile-bio placeholder">Nessuna biografia disponibile</p>
          
          <!-- Stats follower/following con pulsante follow -->
          <div class="profile-stats-section">
            <div class="profile-stats">
              <div class="stat">
                <span class="stat-number">{{ proposteUtente.length }}</span>
                <span class="stat-label">Proposte</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ proposteHyped.length }}</span>
                <span class="stat-label">Hyped</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ followStats.followersCount }}</span>
                <span class="stat-label">Follower</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ followStats.followingCount }}</span>
                <span class="stat-label">Seguiti</span>
              </div>
            </div>
            
                          <!-- Pulsante follow/unfollow (solo se non è il proprio profilo, è loggato e non è operatore) -->
            <div v-if="!isOwnProfile && isLoggedIn && !userStore.isOperatore" class="follow-actions">
              <button 
                @click="toggleFollow" 
                :disabled="loadingFollow"
                :class="[
                  'btn-follow',
                  followStatus.isFollowing ? 'following' : 'not-following'
                ]"
              >
                <i v-if="loadingFollow" class="fas fa-spinner fa-spin"></i>
                <template v-else>
                  {{ followStatus.isFollowing ? 'Non seguire' : 'Segui' }}
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs per i contenuti -->
      <div class="profile-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.value"
          @click="selectedTab = tab.value"
          :class="['tab-btn', { active: selectedTab === tab.value }]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Contenuto delle tabs -->
      <div class="tab-content">
        <!-- Tab Proposte -->
        <div v-if="selectedTab === 'proposte'" class="proposte-tab">
          <div v-if="loadingProposte" class="loading-section">
            <div class="loading-spinner small"></div>
            <p>Caricamento proposte...</p>
          </div>
          
          <div v-else-if="proposteUtente.length === 0" class="empty-state">
            <i class="fas fa-lightbulb"></i>
            <h3>Nessuna proposta</h3>
            <p>{{ nomeCompleto }} non ha ancora pubblicato proposte approvate</p>
          </div>
          
          <div v-else class="proposals-grid">
            <div 
              v-for="proposta in proposteUtente" 
              :key="proposta._id"
              class="proposal-card"
              @click="$router.push(`/proposte/${proposta._id}`)"
            >
              <div class="proposal-image-container">
                <img 
                  v-if="proposta.foto?.data"
                  :src="`data:${proposta.foto.contentType};base64,${proposta.foto.data}`"
                  class="proposal-image"
                  :alt="proposta.titolo"
                />
                <div v-else class="proposal-image-placeholder">
                  <span>📸</span>
                </div>
              </div>
              <div class="proposal-content">
                <div class="proposal-header">
                  <span class="proposal-hype">
                    <span class="hype-icon">⚡</span>
                    {{ proposta.listaHyper?.length || 0 }}
                  </span>
                  <span class="proposal-category">{{ proposta.categoria || 'Generale' }}</span>
                </div>
                <h3 class="proposal-title">{{ proposta.titolo }}</h3>
                <p class="proposal-description">{{ truncateText(proposta.descrizione, 100) }}</p>
                <div class="proposal-footer">
                  <span class="proposal-date">
                    {{ new Date(proposta.createdAt).toLocaleDateString('it-IT') }}
                  </span>
                  <span v-if="proposta.luogo?.citta" class="proposal-location">
                    📍 {{ proposta.luogo.citta }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Hyped -->
        <div v-if="selectedTab === 'hyped'" class="hyped-tab">
          <div v-if="loadingHyped" class="loading-section">
            <div class="loading-spinner small"></div>
            <p>Caricamento proposte hyped...</p>
          </div>
          
          <div v-else-if="proposteHyped.length === 0" class="empty-state">
            <i class="fas fa-fire"></i>
            <h3>Nessuna proposta hyped</h3>
            <p>{{ nomeCompleto }} non ha ancora fatto hype a nessuna proposta</p>
          </div>
          
          <div v-else class="proposals-grid">
            <div 
              v-for="proposta in proposteHyped" 
              :key="proposta._id"
              class="proposal-card"
              @click="$router.push(`/proposte/${proposta._id}`)"
            >
              <div class="proposal-image-container">
                <img 
                  v-if="proposta.foto?.data"
                  :src="`data:${proposta.foto.contentType};base64,${proposta.foto.data}`"
                  class="proposal-image"
                  :alt="proposta.titolo"
                />
                <div v-else class="proposal-image-placeholder">
                  <span>📸</span>
                </div>
              </div>
              <div class="proposal-content">
                <div class="proposal-header">
                  <span class="proposal-hype">
                    <span class="hype-icon">⚡</span>
                    {{ proposta.listaHyper?.length || 0 }}
                  </span>
                  <span class="proposal-category">{{ proposta.categoria || 'Generale' }}</span>
                </div>
                <h3 class="proposal-title">{{ proposta.titolo }}</h3>
                <p class="proposal-description">{{ truncateText(proposta.descrizione, 100) }}</p>
                <div class="proposal-footer">
                  <span class="proposal-date">
                    {{ new Date(proposta.createdAt).toLocaleDateString('it-IT') }}
                  </span>
                  <span v-if="proposta.luogo?.citta" class="proposal-location">
                    📍 {{ proposta.luogo.citta }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Following -->
        <div v-if="selectedTab === 'following'" class="following-tab">
          <div v-if="loadingFollowing" class="loading-section">
            <div class="loading-spinner small"></div>
            <p>Caricamento seguiti...</p>
          </div>
          
          <div v-else-if="followingList.length === 0" class="empty-state">
            <i class="fas fa-user-friends"></i>
            <h3>Non segue nessuno</h3>
            <p>{{ nomeCompleto }} non segue ancora nessuno</p>
          </div>
          
          <div v-else class="following-users-grid">
            <div 
              v-for="user in followingList" 
              :key="user._id"
              class="following-user-card"
              @click="navigateToUser(user._id)"
            >
              <div class="user-image-container">
                <img 
                  v-if="user.fotoProfilo?.data" 
                  :src="`data:${user.fotoProfilo.contentType};base64,${user.fotoProfilo.data}`"
                  class="user-image"
                  :alt="`Foto profilo di ${user.nome}`"
                />
                <div v-else class="user-image-placeholder">
                  {{ user.nome?.charAt(0)?.toUpperCase() || '?' }}
                </div>
              </div>
              <div class="user-content">
                <h4 class="user-name">{{ `${user.nome} ${user.cognome || ''}`.trim() }}</h4>
                <p v-if="user.biografia" class="user-bio">{{ truncateText(user.biografia, 80) }}</p>
                <p v-else class="user-bio-placeholder">Nessuna biografia</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal per mostrare lista following -->
    <div v-if="showFollowing" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Seguiti</h3>
          <button @click="closeModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="modalLoading" class="loading-section">
            <div class="loading-spinner small"></div>
            <p>Caricamento...</p>
          </div>
          <div v-else class="users-list">
            <div 
              v-for="user in modalUsersList" 
              :key="user._id"
              class="user-item"
              @click="navigateToUserAndCloseModal(user._id)"
            >
              <div class="user-avatar small">
                <img 
                  v-if="user.fotoProfilo?.data" 
                  :src="`data:${user.fotoProfilo.contentType};base64,${user.fotoProfilo.data}`"
                  :alt="`Foto profilo di ${user.nome}`"
                />
                <div v-else class="avatar-placeholder small">
                  {{ user.nome?.charAt(0)?.toUpperCase() || '?' }}
                </div>
              </div>
              <div class="user-info">
                <h4 class="user-name">{{ `${user.nome} ${user.cognome || ''}`.trim() }}</h4>
                <p v-if="user.biografia" class="user-bio">{{ truncateText(user.biografia, 40) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { useFollowStore } from '@/stores/followStore';
import { useModal } from '@/composables/useModal';
import { getUserById } from '@/api/userApi';
import { getAllProposte, getUserProposte } from '@/api/propostaApi';
import type { IUser } from '@/types/User';
import type { IProposta } from '@/types/Proposta';
import type { FollowStatus } from '@/types/Follow';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const followStore = useFollowStore();
const { showError } = useModal();

// Stato reattivo
const loading = ref(true);
const error = ref('');
const userProfile = ref<IUser | null>(null);
const userId = ref(route.params.id as string);

// Tabs
const selectedTab = ref('proposte');
const tabs = computed(() => {
  const baseTabs = [
    { label: 'Proposte', value: 'proposte' },
    { label: 'Hyped', value: 'hyped' },
    { label: 'Seguiti', value: 'following' }
  ];
  
  return baseTabs;
});

// Dati delle proposte
const proposteUtente = ref<IProposta[]>([]);
const proposteHyped = ref<IProposta[]>([]);
const loadingProposte = ref(false);
const loadingHyped = ref(false);

// Dati follow
const followStatus = ref<FollowStatus>({
  isFollowing: false,
  followersCount: 0,
  followingCount: 0
});
const followStats = ref({
  followersCount: 0,
  followingCount: 0
});
const followingList = ref<IUser[]>([]);
const loadingFollow = ref(false);
const loadingFollowing = ref(false);

// Modal per lista following
const showFollowing = ref(false);
const modalLoading = ref(false);
const modalUsersList = ref<IUser[]>([]);

// Computed properties
const isLoggedIn = computed(() => !!userStore.token);
const isOwnProfile = computed(() => userStore.user?._id === userId.value);

const nomeCompleto = computed(() => {
  if (!userProfile.value) return '';
  if (userProfile.value.cognome) {
    return `${userProfile.value.nome} ${userProfile.value.cognome}`;
  }
  return userProfile.value.nome;
});

const fotoProfiloUrl = computed(() => {
  if (userProfile.value?.fotoProfilo?.data) {
    return `data:${userProfile.value.fotoProfilo.contentType};base64,${userProfile.value.fotoProfilo.data}`;
  }
  return null;
});

// Badge per il tipo di utente
const getUserTypeClass = () => {
  if (!userProfile.value?.user_type) {
    return 'type-user'; // fallback per utenti privati
  }
  return userProfile.value.user_type === 'ente' ? 'type-ente' : 'type-user';
};

const getUserTypeLabel = () => {
  if (!userProfile.value?.user_type) {
    return 'UTENTE PRIVATO'; // fallback
  }
  return userProfile.value.user_type === 'ente' ? 'ENTE' : 'UTENTE PRIVATO';
};

// Metodi helper
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('it-IT');
};

// Caricamento dati del profilo utente
const loadUserProfile = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    // Carica i dati pubblici dell'utente
    const response = await getUserById(userId.value);
    userProfile.value = response.data.user;
    
    // Carica gli stats di follow
    await loadFollowStats();
    
    // Se l'utente è loggato, carica anche il suo status di follow
    if (isLoggedIn.value && !isOwnProfile.value) {
      await loadFollowStatus();
    }
    
  } catch (err: any) {
    console.error('❌ Errore nel caricamento del profilo:', err);
    error.value = err.message || 'Utente non trovato';
  } finally {
    loading.value = false;
  }
};

// Caricamento stats di follow
const loadFollowStats = async () => {
  try {
    let stats;
    
    if (isOwnProfile.value) {
      // Se è il proprio profilo, usa il metodo per i propri stats
      stats = await followStore.loadMyFollowStats(userId.value);

    } else {
      // Se è il profilo di un altro utente, usa il metodo generico
      stats = await followStore.loadUserFollowStats(userId.value);
      
    }
    
    followStats.value = {
      followersCount: stats.followersCount,
      followingCount: stats.followingCount
    };
  } catch (err) {
    console.error('❌ Errore nel caricamento degli stats di follow:', err);
    followStats.value = { followersCount: 0, followingCount: 0 };
  }
};

// Caricamento status di follow dell'utente corrente
const loadFollowStatus = async () => {
  try {
    followStatus.value = await followStore.loadFollowStatus(userId.value);
  } catch (err) {
    console.error('❌ Errore nel caricamento del follow status:', err);
    followStatus.value = { isFollowing: false, followersCount: 0, followingCount: 0 };
  }
};

// Caricamento proposte dell'utente
const loadProposteUtente = async () => {
  try {
    loadingProposte.value = true;
    proposteUtente.value = await getUserProposte(userId.value);
  } catch (err: any) {
    console.error('❌ Errore nel caricamento delle proposte utente:', err);
    proposteUtente.value = [];
  } finally {
    loadingProposte.value = false;
  }
};

// Caricamento proposte hyped
const loadProposteHyped = async () => {
  try {
    loadingHyped.value = true;
    const response = await getAllProposte();
    const allProposte = response.data || response;
    
    proposteHyped.value = allProposte.filter(
      (p: IProposta) => p.listaHyper?.includes(userId.value)
    );
  } catch (err: any) {
    console.error('❌ Errore nel caricamento delle proposte hyped:', err);
    proposteHyped.value = [];
  } finally {
    loadingHyped.value = false;
  }
};

// Caricamento following
const loadFollowing = async () => {
  try {
    loadingFollowing.value = true;
    followingList.value = await followStore.loadFollowing(userId.value);
    
    // Debug: verifica se l'utente stesso è nella lista
    const currentUserId = userStore.user?._id;
    const hasSelfInList = followingList.value.some((user: IUser) => user._id === currentUserId);
    if (hasSelfInList) {
      console.warn('⚠️ L\'utente stesso è presente nella lista dei seguiti!', { currentUserId, userId: userId.value });
    }
    
    // Aggiorna anche il count dei following con il numero reale caricato
    followStats.value.followingCount = followingList.value.length;
    
    
  } catch (err: any) {
    console.error('❌ Errore nel caricamento dei seguiti:', err);
    followingList.value = [];
    await showError('Errore nel caricamento dei seguiti', err.message);
  } finally {
    loadingFollowing.value = false;
  }
};

// Toggle follow/unfollow
const toggleFollow = async () => {
  if (!isLoggedIn.value) {
    await showError('Accesso richiesto', 'Devi essere loggato per seguire gli utenti');
    return;
  }
  
  try {
    loadingFollow.value = true;
    
    // Debug info

    
    await followStore.toggleFollow(userId.value);
    
    // Aggiorna lo status locale
    followStatus.value.isFollowing = !followStatus.value.isFollowing;
    
    // Aggiorna anche gli stats
    if (followStatus.value.isFollowing) {
      followStats.value.followersCount++;
      
    } else {
      followStats.value.followersCount = Math.max(0, followStats.value.followersCount - 1);
      
    }
    
  } catch (err: any) {
    console.error('❌ Errore nel toggle follow:', err);
    console.error('❌ Dettagli errore:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    await showError('Errore', err.message || 'Errore durante l\'operazione');
  } finally {
    loadingFollow.value = false;
  }
};

// Navigazione a profilo utente
const navigateToUser = (targetUserId: string) => {
  if (targetUserId === userId.value) return; // Già sul profilo corrente
  router.push(`/users/${targetUserId}`);
};

const navigateToUserAndCloseModal = (targetUserId: string) => {
  closeModal();
  navigateToUser(targetUserId);
};

// Gestione modal
const openFollowingModal = async () => {
  showFollowing.value = true;
  modalLoading.value = true;
  try {
    modalUsersList.value = await followStore.loadFollowing(userId.value);
  } catch (err) {
    console.error('❌ Errore nel caricamento following per modal:', err);
    modalUsersList.value = [];
  } finally {
    modalLoading.value = false;
  }
};

const closeModal = () => {
  showFollowing.value = false;
  modalUsersList.value = [];
};

// Watch per cambiamenti di tab
watch(selectedTab, async (newTab) => {
  switch (newTab) {
    case 'proposte':
      if (proposteUtente.value.length === 0) {
        await loadProposteUtente();
      }
      break;
    case 'hyped':
      // Gli hyped vengono già caricati all'inizio, non serve ricaricarli
      break;
    case 'following':
      if (followingList.value.length === 0) {
        await loadFollowing();
      }
      break;
  }
});

// Watch per cambiamenti di route (navigazione tra profili utente)
watch(() => route.params.id, (newId) => {
  if (newId && newId !== userId.value) {
    userId.value = newId as string;
    // Reset tutti i dati
    userProfile.value = null;
    proposteUtente.value = [];
    proposteHyped.value = [];
    followingList.value = [];
    selectedTab.value = 'proposte';
    // Ricarica il profilo
    loadUserProfile();
    // Ricarica anche proposte e hyped
    loadProposteUtente();
    loadProposteHyped();
  }
});

// Caricamento iniziale
onMounted(() => {
  loadUserProfile();
  // Carica subito le proposte (prima tab) e gli hyped
  loadProposteUtente();
  loadProposteHyped();
});
</script>

<style scoped>
.user-profile-container {
  min-height: 100vh;
  background: var(--color-background-soft);
  padding-bottom: 80px;
}

/* Loading e Error States */
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.loading-container p, .error-container p {
  color: var(--color-text);
  margin: 0;
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

.error-message {
  color: #fe4654;
  font-weight: 500;
}

/* Header del profilo */
.profile-header {
  background: var(--color-card-background);
  margin: 1rem 1.5rem 0.8rem 1.5rem;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 16px var(--color-shadow);
  display: flex;
  gap: 1.2rem;
  align-items: flex-start;
}

.avatar-section {
  flex-shrink: 0;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fe4654;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fe4654;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
}

.profile-info {
  flex: 1;
}

.profile-name-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.nome-utente {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
}

.user-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  animation: badgeAppear 0.5s ease-out;
}

@keyframes badgeAppear {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.user-type-badge.type-user {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #bbdefb;
}

.user-type-badge.type-ente {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
}

.profile-bio {
  color: var(--color-text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.profile-bio.placeholder {
  font-style: italic;
  color: var(--color-text-secondary);
  opacity: 0.8;
}

.profile-stats-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.profile-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fe4654;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-top: 0.2rem;
}

.stat-loading {
  display: inline-block;
  animation: pulse 1.5s ease-in-out infinite;
  color: #fe4654;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.follow-actions {
  flex-shrink: 0;
}

.btn-follow {
  background: var(--color-background);
  color: var(--color-text);
  border: 2px solid var(--color-border);
  border-radius: 1.5rem;
  padding: 0.85rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.btn-follow:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-follow.not-following {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.btn-follow.not-following:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--color-primary-light);
}

.btn-follow.following {
  background: var(--color-secondary);
  color: #fff;
  border-color: var(--color-secondary);
}

.btn-follow.following:hover:not(:disabled) {
  background: #dc3545;
  border-color: #dc3545;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.3);
}

/* Dark mode improvements */
@media (prefers-color-scheme: dark) {
  .btn-follow {
    background: var(--color-background-soft);
    border-color: var(--color-border);
    color: var(--color-text);
  }
  
  .btn-follow.not-following {
    background: var(--color-primary);
    color: #fff;
    border-color: var(--color-primary);
  }
  
  .btn-follow.following {
    background: var(--color-background-soft);
    color: var(--color-text);
    border-color: var(--color-border);
  }
  
  .btn-follow.following:hover:not(:disabled) {
    background: #dc3545;
    color: #fff;
    border-color: #dc3545;
  }
  
  .user-type-badge.type-user {
    background: rgba(33, 150, 243, 0.2);
    color: #90caf9;
    border: 1px solid rgba(33, 150, 243, 0.3);
  }
  
  .user-type-badge.type-ente {
    background: rgba(156, 39, 176, 0.2);
    color: #ce93d8;
    border: 1px solid rgba(156, 39, 176, 0.3);
  }
}

.own-profile-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 1rem;
  background: var(--color-primary-light);
  border-radius: 0.5rem;
  color: var(--color-primary);
  font-weight: 500;
  margin-top: 1rem;
}

.edit-profile-link {
  margin-left: auto;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.edit-profile-link:hover {
  text-decoration: underline;
}

/* Tabs */
.profile-tabs {
  background: var(--color-card-background);
  border-radius: 1rem;
  margin: 0 1.5rem 1rem 1.5rem;
  padding: 0.4rem;
  display: flex;
  gap: 0.4rem;
  box-shadow: 0 2px 16px var(--color-shadow);
}

.tab-btn {
  flex: 1;
  background: none;
  color: var(--color-text-secondary);
  border: none;
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tab-btn:hover {
  color: var(--color-text);
}

.tab-btn.active {
  background: var(--color-primary);
  color: #fff;
}

/* Contenuto */
.tab-content {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.loading-section {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--color-card-background);
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px var(--color-shadow);
}

.loading-spinner.small {
  width: 30px;
  height: 30px;
  border-width: 3px;
  margin-bottom: 1rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--color-card-background);
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px var(--color-shadow);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--color-text-secondary);
}

.empty-state h3 {
  color: #404149;
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--color-text-secondary);
  margin: 0;
}

/* Grids */
.proposals-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* Card proposte */
.proposal-card {
  background: var(--color-card-background);
  border-radius: 1.2rem;
  overflow: hidden;
  box-shadow: 0 2px 16px var(--color-shadow);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.proposal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px var(--color-shadow);
}

.proposal-image-container {
  width: 100%;
  height: 160px;
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
  color: var(--color-text-secondary);
  font-size: 2rem;
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
  align-items: center;
  margin-bottom: 1rem;
}

.proposal-hype {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--color-card-background);
  color: var(--color-primary);
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  border: 1px solid var(--color-primary-light);
}

.hype-icon {
  font-size: 1rem;
}

.proposal-category {
  background: var(--color-background-mute);
  color: var(--color-text);
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.proposal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
}

.proposal-description {
  color: var(--color-text);
  margin: 0 0 1rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.proposal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-top: auto;
}

/* Pulsanti azione */
.action-button {
  background: none;
  border: 1px solid;
  border-radius: 1rem;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.delete-button {
  color: #dc3545;
  border-color: #dc3545;
}

.delete-button:hover {
  background: #dc3545;
  color: #fff;
}

.unhype-button {
  color: #fe4654;
  border-color: #fe4654;
}

.unhype-button:hover {
  background: #fe4654;
  color: #fff;
}

.proposal-author {
  font-style: italic;
}

.proposal-date {
  font-weight: 500;
}

.proposal-location {
  font-style: italic;
  color: var(--color-text-secondary);
}

.date {
  font-weight: 500;
}

/* Following User Cards - Vertical Layout */
.following-users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

.following-user-card {
  background: var(--color-card-background);
  border-radius: 1.2rem;
  padding: 1.5rem;
  box-shadow: 0 2px 16px var(--color-shadow);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
}

.following-user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px var(--color-shadow-hover);
  border-color: var(--color-primary);
}

.user-image-container {
  position: relative;
  margin-bottom: 1rem;
}

.user-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--color-border);
  transition: all 0.3s ease;
}

.following-user-card:hover .user-image {
  border-color: var(--color-primary);
  transform: scale(1.05);
}

.user-image-placeholder {
  width: 80px;
  height: 80px;
  background: var(--color-background-mute);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--color-text-secondary);
  border: 3px solid var(--color-border);
  transition: all 0.3s ease;
}

.following-user-card:hover .user-image-placeholder {
  border-color: var(--color-primary);
  transform: scale(1.05);
}

.user-content {
  width: 100%;
}

.user-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.user-bio {
  color: var(--color-text);
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.user-bio-placeholder {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-style: italic;
  margin: 0 0 1rem 0;
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
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
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
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #666;
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  max-height: calc(90vh - 100px);
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 1rem;
  border-radius: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.user-item:hover {
  background: var(--color-background-soft);
}

.user-avatar.small img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fe4654;
}

/* Buttons */
.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--color-primary-light);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stili per immagini placeholder delle proposte */
.proposal-image-placeholder {
  color: var(--color-text-secondary);
  font-size: 2rem;
}

.hype-icon {
  font-size: 1rem;
}

/* Responsive */
@media (min-width: 768px) {
  .proposals-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .profile-header {
    margin: 1rem 2rem 1rem 2rem;
    padding: 2rem;
  }
  
  .profile-tabs {
    margin: 0 2rem 1rem 2rem;
  }
  
  .tab-content {
    padding: 0 2rem 1.5rem 2rem;
  }
}

@media (min-width: 1024px) {
  .proposals-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 767px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .profile-name-section {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .profile-stats {
    justify-content: center;
    gap: 3rem;
  }
  
  .profile-stats-section {
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }
  
  .follow-actions {
    width: 100%;
  }
  
  .btn-follow {
    width: 100%;
  }
  
  .profile-tabs {
    margin: 0 1rem 1rem 1rem;
    flex-wrap: wrap;
  }
  
  .tab-content {
    padding: 0 1rem 1.5rem 1rem;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
}

/* Responsive per la griglia utenti */
@media (max-width: 768px) {
  .following-users-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .following-user-card {
    padding: 1rem;
  }
  
  .user-image,
  .user-image-placeholder {
    width: 70px;
    height: 70px;
  }
}
</style>
