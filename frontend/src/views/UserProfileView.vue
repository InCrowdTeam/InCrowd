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
      <p>{{ error }}</p>
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
            <i class="fas fa-user"></i>
          </div>
        </div>
        
        <div class="profile-info">
          <h1 class="nome-utente">{{ nomeCompleto }}</h1>
          <p v-if="userProfile.biografia" class="biografia">{{ userProfile.biografia }}</p>
          <p v-else class="biografia placeholder">Nessuna biografia disponibile</p>
          
          <!-- Stats follower/following -->
          <div class="follow-stats">
            <div class="stat" @click="showFollowers = true">
              <span class="stat-number">{{ followStats.followersCount }}</span>
              <span class="stat-label">Follower</span>
            </div>
            <div class="stat" @click="showFollowing = true">
              <span class="stat-number">{{ followStats.followingCount }}</span>
              <span class="stat-label">Seguiti</span>
            </div>
          </div>
          
          <!-- Pulsante follow/unfollow (solo se non è il proprio profilo) -->
          <div v-if="!isOwnProfile && isLoggedIn" class="follow-actions">
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
                <i :class="followStatus.isFollowing ? 'fas fa-user-minus' : 'fas fa-user-plus'"></i>
                {{ followStatus.isFollowing ? 'Non seguire' : 'Segui' }}
              </template>
            </button>
          </div>
          
          <!-- Messaggio se è il proprio profilo -->
          <div v-if="isOwnProfile" class="own-profile-notice">
            <i class="fas fa-info-circle"></i>
            Questo è il tuo profilo pubblico
            <router-link to="/profilo" class="edit-profile-link">Modifica profilo</router-link>
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
          <span v-if="getTabCount(tab.value)" class="tab-count">{{ getTabCount(tab.value) }}</span>
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
          
          <div v-else class="proposte-grid">
            <div 
              v-for="proposta in proposteUtente" 
              :key="proposta._id"
              class="proposta-card"
              @click="$router.push(`/proposte/${proposta._id}`)"
            >
              <div v-if="proposta.foto?.data" class="proposta-image">
                <img 
                  :src="`data:${proposta.foto.contentType};base64,${proposta.foto.data}`" 
                  :alt="proposta.titolo"
                />
              </div>
              <div class="proposta-content">
                <h4 class="proposta-title">{{ proposta.titolo }}</h4>
                <p class="proposta-description">{{ truncateText(proposta.descrizione, 100) }}</p>
                <div class="proposta-meta">
                  <span v-if="proposta.categoria" class="categoria">{{ proposta.categoria }}</span>
                  <span v-if="proposta.luogo?.citta" class="citta">{{ proposta.luogo.citta }}</span>
                </div>
                <div class="proposta-stats">
                  <span class="hype-count">
                    <i class="fas fa-fire"></i>
                    {{ proposta.listaHyper?.length || 0 }}
                  </span>
                  <span class="date">{{ formatDate(proposta.createdAt.toString()) }}</span>
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
          
          <div v-else class="proposte-grid">
            <div 
              v-for="proposta in proposteHyped" 
              :key="proposta._id"
              class="proposta-card"
              @click="$router.push(`/proposte/${proposta._id}`)"
            >
              <div v-if="proposta.foto?.data" class="proposta-image">
                <img 
                  :src="`data:${proposta.foto.contentType};base64,${proposta.foto.data}`" 
                  :alt="proposta.titolo"
                />
              </div>
              <div class="proposta-content">
                <h4 class="proposta-title">{{ proposta.titolo }}</h4>
                <p class="proposta-description">{{ truncateText(proposta.descrizione, 100) }}</p>
                <div class="proposta-meta">
                  <span v-if="proposta.categoria" class="categoria">{{ proposta.categoria }}</span>
                  <span v-if="proposta.luogo?.citta" class="citta">{{ proposta.luogo.citta }}</span>
                </div>
                <div class="proposta-stats">
                  <span class="hype-count">
                    <i class="fas fa-fire"></i>
                    {{ proposta.listaHyper?.length || 0 }}
                  </span>
                  <span class="date">{{ formatDate(proposta.createdAt.toString()) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Follower -->
        <div v-if="selectedTab === 'follower'" class="follower-tab">
          <div v-if="loadingFollowers" class="loading-section">
            <div class="loading-spinner small"></div>
            <p>Caricamento follower...</p>
          </div>
          
          <div v-else-if="followersList.length === 0" class="empty-state">
            <i class="fas fa-users"></i>
            <h3>Nessun follower</h3>
            <p>{{ nomeCompleto }} non ha ancora follower</p>
          </div>
          
          <div v-else class="users-grid">
            <div 
              v-for="user in followersList" 
              :key="user._id"
              class="user-card"
              @click="navigateToUser(user._id)"
            >
              <div class="user-avatar">
                <img 
                  v-if="user.fotoProfilo?.data" 
                  :src="`data:${user.fotoProfilo.contentType};base64,${user.fotoProfilo.data}`"
                  :alt="`Foto profilo di ${user.nome}`"
                />
                <div v-else class="avatar-placeholder small">
                  <i class="fas fa-user"></i>
                </div>
              </div>
              <div class="user-info">
                <h4 class="user-name">{{ `${user.nome} ${user.cognome}`.trim() }}</h4>
                <p v-if="user.biografia" class="user-bio">{{ truncateText(user.biografia, 60) }}</p>
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
          
          <div v-else class="users-grid">
            <div 
              v-for="user in followingList" 
              :key="user._id"
              class="user-card"
              @click="navigateToUser(user._id)"
            >
              <div class="user-avatar">
                <img 
                  v-if="user.fotoProfilo?.data" 
                  :src="`data:${user.fotoProfilo.contentType};base64,${user.fotoProfilo.data}`"
                  :alt="`Foto profilo di ${user.nome}`"
                />
                <div v-else class="avatar-placeholder small">
                  <i class="fas fa-user"></i>
                </div>
              </div>
              <div class="user-info">
                <h4 class="user-name">{{ `${user.nome} ${user.cognome}`.trim() }}</h4>
                <p v-if="user.biografia" class="user-bio">{{ truncateText(user.biografia, 60) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal per mostrare lista follower/following -->
    <div v-if="showFollowers || showFollowing" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ showFollowers ? 'Follower' : 'Seguiti' }}</h3>
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
                  <i class="fas fa-user"></i>
                </div>
              </div>
              <div class="user-info">
                <h4 class="user-name">{{ `${user.nome} ${user.cognome}`.trim() }}</h4>
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
const tabs = [
  { label: 'Proposte', value: 'proposte' },
  { label: 'Hyped', value: 'hyped' },
  { label: 'Follower', value: 'follower' },
  { label: 'Seguiti', value: 'following' }
];

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
const followersList = ref<IUser[]>([]);
const followingList = ref<IUser[]>([]);
const loadingFollow = ref(false);
const loadingFollowers = ref(false);
const loadingFollowing = ref(false);

// Modal per lista follower/following
const showFollowers = ref(false);
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

// Metodi helper
const getTabCount = (tabValue: string) => {
  switch (tabValue) {
    case 'proposte': return proposteUtente.value.length;
    case 'hyped': return proposteHyped.value.length;
    case 'follower': return followStats.value.followersCount;
    case 'following': return followStats.value.followingCount;
    default: return 0;
  }
};

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
    userProfile.value = await getUserById(userId.value);
    
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
      console.log(`✅ Stats di follow caricati per il proprio profilo: ${stats.followersCount} follower, ${stats.followingCount} following`);
    } else {
      // Se è il profilo di un altro utente, usa il metodo generico
      stats = await followStore.loadUserFollowStats(userId.value);
      console.log(`✅ Stats di follow caricati per utente ${userId.value}: ${stats.followersCount} follower, ${stats.followingCount} following`);
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

// Caricamento followers
const loadFollowers = async () => {
  try {
    loadingFollowers.value = true;
    followersList.value = await followStore.loadFollowers(userId.value);
    
    // Debug: verifica se l'utente stesso è nella lista
    const currentUserId = userStore.user?._id;
    const hasSelfInList = followersList.value.some(user => user._id === currentUserId);
    if (hasSelfInList) {
      console.warn('⚠️ L\'utente stesso è presente nella lista dei followers!', { currentUserId, userId: userId.value });
    }
    
    // Aggiorna anche il count dei followers con il numero reale caricato
    followStats.value.followersCount = followersList.value.length;
    
    console.log(`✅ Caricati ${followersList.value.length} followers (Lista reale aggiornata)`);
  } catch (err: any) {
    console.error('❌ Errore nel caricamento dei followers:', err);
    followersList.value = [];
    await showError('Errore nel caricamento dei followers', err.message);
  } finally {
    loadingFollowers.value = false;
  }
};

// Caricamento following
const loadFollowing = async () => {
  try {
    loadingFollowing.value = true;
    followingList.value = await followStore.loadFollowing(userId.value);
    
    // Debug: verifica se l'utente stesso è nella lista
    const currentUserId = userStore.user?._id;
    const hasSelfInList = followingList.value.some(user => user._id === currentUserId);
    if (hasSelfInList) {
      console.warn('⚠️ L\'utente stesso è presente nella lista dei seguiti!', { currentUserId, userId: userId.value });
    }
    
    // Aggiorna anche il count dei following con il numero reale caricato
    followStats.value.followingCount = followingList.value.length;
    
    console.log(`✅ Caricati ${followingList.value.length} utenti seguiti (Lista reale aggiornata)`);
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
const openFollowersModal = async () => {
  showFollowers.value = true;
  modalLoading.value = true;
  try {
    modalUsersList.value = await followStore.loadFollowers(userId.value);
  } catch (err) {
    console.error('❌ Errore nel caricamento followers per modal:', err);
    modalUsersList.value = [];
  } finally {
    modalLoading.value = false;
  }
};

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
  showFollowers.value = false;
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
      if (proposteHyped.value.length === 0) {
        await loadProposteHyped();
      }
      break;
    case 'follower':
      if (followersList.value.length === 0) {
        await loadFollowers();
      }
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
    followersList.value = [];
    followingList.value = [];
    selectedTab.value = 'proposte';
    // Ricarica il profilo
    loadUserProfile();
  }
});

// Caricamento iniziale
onMounted(() => {
  loadUserProfile();
  // Carica subito le proposte (prima tab)
  loadProposteUtente();
});
</script>

<style scoped>
.user-profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

/* Loading e Error states */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-background-mute);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-spinner.small {
  width: 30px;
  height: 30px;
  border-width: 3px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Profile Header */
.profile-header {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  padding: 30px;
  background: var(--color-card-background);
  border-radius: 15px;
  box-shadow: 0 2px 16px var(--color-shadow);
}

.avatar-section {
  flex-shrink: 0;
}

.avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--color-primary);
}

.avatar-placeholder {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fe4654 0%, #404149 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 60px;
}

.avatar-placeholder.small {
  width: 50px;
  height: 50px;
  font-size: 20px;
}

.profile-info {
  flex-grow: 1;
}

.nome-utente {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 10px;
}

.biografia {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  margin-bottom: 20px;
  line-height: 1.6;
}

.biografia.placeholder {
  font-style: italic;
  color: var(--color-text-secondary);
  opacity: 0.8;
}

.follow-stats {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.stat:hover {
  background-color: var(--color-background-soft);
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.follow-actions {
  margin-top: 20px;
}

.btn-follow {
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-follow:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-follow.not-following {
  background: linear-gradient(135deg, #fe4654 0%, #404149 100%);
  color: white;
}

.btn-follow.not-following:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--color-primary-light);
}

.btn-follow.following {
  background: var(--color-secondary);
  color: white;
}

.btn-follow.following:hover:not(:disabled) {
  background: var(--color-primary);
  transform: translateY(-2px);
}

.own-profile-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: var(--color-primary-light);
  border-radius: 8px;
  color: var(--color-primary);
  font-weight: 500;
  margin-top: 20px;
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
  display: flex;
  background: var(--color-card-background);
  border-radius: 10px;
  padding: 5px;
  margin-bottom: 30px;
  box-shadow: 0 2px 16px var(--color-shadow);
}

.tab-btn {
  flex: 1;
  padding: 15px 20px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab-btn:hover {
  background: var(--color-background-soft);
  color: var(--color-primary);
}

.tab-btn.active {
  background: linear-gradient(135deg, #fe4654 0%, #404149 100%);
  color: white;
}

.tab-count {
  background: rgba(255,255,255,0.3);
  color: inherit;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.tab-btn.active .tab-count {
  background: rgba(255,255,255,0.3);
}

/* Tab Content */
.tab-content {
  min-height: 400px;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--color-text-secondary);
}

.empty-state i {
  font-size: 4rem;
  color: var(--color-border);
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: var(--color-heading);
}

/* Proposte Grid */
.proposte-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.proposta-card {
  background: var(--color-card-background);
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 16px var(--color-shadow);
}

.proposta-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px var(--color-shadow);
}

.proposta-image {
  height: 200px;
  overflow: hidden;
}

.proposta-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.proposta-content {
  padding: 20px;
}

.proposta-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 10px;
}

.proposta-description {
  color: var(--color-text-secondary);
  margin-bottom: 15px;
  line-height: 1.5;
}

.proposta-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.categoria,
.citta {
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.proposta-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hype-count {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-primary);
  font-weight: 600;
}

.date {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

/* Users Grid */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.user-card {
  background: var(--color-card-background);
  border-radius: 15px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 16px var(--color-shadow);
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px var(--color-shadow);
}

.user-avatar {
  flex-shrink: 0;
}

.user-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex-grow: 1;
  min-width: 0;
}

.user-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 5px;
}

.user-bio {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-card-background);
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: var(--color-heading);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background: var(--color-background-soft);
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
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
  padding: 10px;
  border-radius: 8px;
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
}

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, #fe4654 0%, #404149 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--color-primary-light);
}

/* Responsive */
@media (max-width: 768px) {
  .user-profile-container {
    padding: 10px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
    padding: 20px;
  }
  
  .nome-utente {
    font-size: 2rem;
  }
  
  .follow-stats {
    justify-content: center;
  }
  
  .profile-tabs {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    min-width: 120px;
  }
  
  .proposte-grid,
  .users-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .user-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>
