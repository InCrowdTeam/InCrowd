<template>
  <div class="proposta-view">
    <!-- Loading State -->
    <div v-if="!proposta" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Caricamento proposta...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="proposta-container">
      <!-- Hero Section with Image -->
      <div class="hero-section">
        <div class="hero-image-container">
          <img
            v-if="proposta.foto"
            :src="processImageUrl(proposta.foto)"
            alt="Foto della proposta"
            class="hero-image"
          />
          <div v-else class="hero-image-placeholder">
            <span class="placeholder-icon">📸</span>
            <p>Nessuna immagine disponibile</p>
          </div>
          
          <!-- Category Badge -->
          <div v-if="proposta.categoria" class="category-hero-badge">
            {{ getCategoryLabel(proposta.categoria) }}
          </div>
          
          <!-- Back Button -->
          <button @click="$router.go(-1)" class="back-btn">
            ← Indietro
          </button>
        </div>

        <!-- Title and Creator -->
        <div class="hero-content">
          <h1 class="proposal-title">{{ proposta.titolo }}</h1>
          
          <!-- Creator Badge and Hyper Counter Row -->
          <div class="creator-hyper-row">
            <div class="creator-badge" @click="goToCreatorProfile" :class="{ clickable: true }">
              <div class="creator-avatar">
                <img 
                  v-if="proponenteAvatar"
                  :src="proponenteAvatar"
                  alt="Avatar del proponente" 
                  class="avatar-image"
                  @error="onProponenteAvatarError"
                />
                <div v-else class="avatar-placeholder">
                  {{ getInitials(proponente?.nome, proponente?.cognome) }}
                </div>
              </div>
              <div class="creator-info">
                <span class="creator-label">Proposto da</span>
                <span class="creator-name">{{ getFullName(proponente) }}</span>
              </div>
            </div>
            
            <!-- Hyper Counter Badge -->
            <div class="hyper-counter-badge">
              <div class="hyper-button-container">
                <button
                  v-if="canHype"
                  class="hyper-btn"
                  :class="{ active: isHyperUser }"
                  :disabled="isHyperLoading"
                  @click="handleHyper"
                  title="Metti un hyper!"
                >
                  <span v-if="!isHyperLoading" class="hyper-icon">⚡</span>
                  <span v-else class="loading-hourglass">⏳</span>
                </button>
                <div v-else class="hyper-disabled-container">
                  <span class="hyper-icon-disabled">⚡</span>
                </div>
              </div>
              <div class="hyper-info">
                <span class="hyper-count">{{ hyperCount }}</span>
                <div v-if="!canHype" class="hyper-disabled-text-compact">
                  <small v-if="isOperatore">Gli operatori non possono mettere hyper</small>
                  <small v-else>Effettua il login per mettere hyper</small>
                </div>
              </div>
            </div>
          </div>
          
          <p class="proposal-description">{{ proposta.descrizione }}</p>
          
          <!-- Dettagli della Proposta -->
          <div class="proposal-details-section">
            <h3 class="details-title">📋 Informazioni</h3>
            
            <div class="details-compact">
              <!-- Indirizzo completo -->
              <div v-if="proposta.luogo" class="detail-item">
                <div class="detail-header">
                  <span class="detail-icon">📍</span>
                  <span class="detail-label">Dove</span>
                </div>
                <div class="detail-content">
                  <div class="detail-primary">{{ proposta.luogo.citta }}</div>
                  <div v-if="proposta.luogo.via || proposta.luogo.civico" class="detail-secondary">
                    {{ formatFullAddress(proposta.luogo) }}
                  </div>
                  <div v-if="proposta.luogo.cap" class="detail-badge">
                    CAP {{ proposta.luogo.cap }}
                  </div>
                </div>
              </div>
              
              <!-- Data dell'evento -->
              <div class="detail-item">
                <div class="detail-header">
                  <span class="detail-icon">📅</span>
                  <span class="detail-label">Quando</span>
                </div>
                <div class="detail-content">
                  <div v-if="proposta.dataIpotetica" class="detail-primary">
                    {{ DateService.formatEventDate(proposta.dataIpotetica.toString()) }}
                  </div>
                  <div v-else class="detail-primary detail-tbd">
                    Data da definire
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Meta Info - Solo data di creazione -->
          <div class="proposal-meta-simple">
            <div class="creation-badge">
              <span class="meta-icon">🗓️</span>
              <span class="meta-text">Creata {{ formatDate(proposta.createdAt.toString()) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Hyper Users Section -->
      <div v-if="hyperUsers.length > 0 || hyperUsersLoading" class="hyper-users-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">⚡</span>
            Enti che supportano questa proposta
          </h2>
          <div class="hyper-count-badge">
            {{ hyperUsers.filter(user => isEnte(user)).length }} 
            {{ hyperUsers.filter(user => isEnte(user)).length === 1 ? 'Ente' : 'Enti' }}
          </div>
        </div>
        
        <!-- Loading State -->
        <div v-if="hyperUsersLoading" class="loading-hyper-users">
          <div class="loading-spinner small"></div>
          <p>Caricamento sostenitori...</p>
        </div>
        
        <!-- Enti che hanno messo hyper -->
        <div v-else-if="hyperUsers.filter(user => isEnte(user)).length > 0" class="hyper-users-grid">
          <div
            v-for="user in hyperUsers.filter(user => isEnte(user))"
            :key="user._id"
            class="hyper-user-card"
            @click="$router.push(`/users/${user._id}`)"
          >
            <div class="hyper-user-avatar">
              <img
                v-if="getHyperUserAvatar(user._id)"
                :src="getHyperUserAvatar(user._id)"
                :alt="`Avatar di ${user.nome}`"
                class="avatar-image"
                @error="(event) => onAvatarError(event, user._id)"
              />
              <div v-else class="avatar-placeholder">
                <span class="avatar-initials">{{ getInitials(user.nome, user.cognome) }}</span>
              </div>
            </div>
            <div class="hyper-user-info">
              <h4 class="hyper-user-name">{{ user.nome }}</h4>
              <span class="hyper-user-type">{{ isEnte(user) ? 'Ente' : 'Utente' }}</span>
              <p v-if="user.biografia" class="hyper-user-bio">{{ user.biografia.substring(0, 80) }}{{ user.biografia.length > 80 ? '...' : '' }}</p>
            </div>
          </div>
        </div>
        
        <!-- Messaggio se non ci sono enti -->
        <div v-else class="no-enti-hyper">
          <span class="empty-icon">🏛️</span>
          <p>Nessun ente ha ancora supportato questa proposta</p>
        </div>
      </div>

      <!-- Comments Section -->
      <div class="comments-section">
        <div class="comments-header">
          <h2 class="comments-title">💬 Commenti</h2>
          <div class="comments-count">{{ commentiProposta.length }} {{ commentiProposta.length === 1 ? 'commento' : 'commenti' }}</div>
        </div>

        <!-- Comment Form -->
        <div v-if="userStore.user && !userStore.isOperatore" class="comment-form-section">
          <div class="comment-form">
            <div class="comment-author-avatar">
              <img 
                v-if="getUserAvatar(userStore.user)"
                :src="getUserAvatar(userStore.user)"
                alt="Foto profilo" 
                class="avatar-image"
                @error="onUserAvatarError"
              />
              <div v-else class="avatar-placeholder">
                {{ getInitials(userStore.user.nome, userStore.user.cognome) }}
              </div>
            </div>
            <div class="comment-input-container">
              <textarea
                v-model="nuovoCommento"
                :disabled="isLoading"
                placeholder="Scrivi un commento..."
                class="comment-textarea"
                rows="3"
                maxlength="500"
                @keydown.ctrl.enter="inviaCommento"
              ></textarea>
              <div class="char-count">{{ nuovoCommento.length }}/500</div>
              <button 
                @click="inviaCommento" 
                :disabled="isLoading || !nuovoCommento.trim()"
                class="comment-submit-btn"
              >
                <span v-if="!isLoading" class="send-icon">Pubblica</span>
                <span v-else class="loading-dots">Invio...</span>
              </button>
            </div>
          </div>
          <small class="keyboard-hint">Premi Ctrl + Invio per inviare rapidamente</small>
        </div>

        <!-- Operator Comment Restriction -->
        <div v-else-if="userStore.user && userStore.isOperatore" class="operator-restriction-card">
          <div class="restriction-icon">🛡️</div>
          <div class="restriction-text">
            <h3>Funzione commenti non disponibile</h3>
            <p>Gli operatori non possono aggiungere commenti alle proposte per mantenere la neutralità della moderazione</p>
          </div>
        </div>

        <!-- Login Reminder -->
        <div v-else class="login-reminder-card">
          <div class="login-icon">🔐</div>
          <div class="login-text">
            <h3>Partecipa alla discussione</h3>
            <p>Effettua il login per lasciare un commento</p>
            <router-link to="/login" class="login-btn">Accedi</router-link>
          </div>
        </div>

        <!-- Comments List -->
        <div class="comments-container">
          <div v-if="isCommentsLoading" class="loading-comments">
            <div class="loading-spinner small"></div>
            <p>Caricamento commenti...</p>
          </div>
          
          <div v-else-if="commentiProposta.length === 0" class="no-comments">
            <div class="empty-icon">💭</div>
            <h3>Nessun commento ancora</h3>
            <p>Sii il primo a commentare questa proposta!</p>
          </div>
          
          <div v-else class="comments-list">
            <div v-for="commento in commentiProposta" :key="commento._id" class="comment-item">
              <div class="comment-avatar">
                <img 
                  v-if="getCommentUserAvatar(commento.utente?._id)"
                  :src="getCommentUserAvatar(commento.utente?._id)"
                  alt="Avatar del commentatore" 
                  class="avatar-image"
                  @error="onAvatarError($event, commento.utente?._id)"
                />
                <div v-else class="avatar-placeholder">
                  {{ getInitials(commento.utente?.nome, commento.utente?.cognome) }}
                </div>
              </div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">{{ getUserName(commento) }}</span>
                  <div class="comment-actions">
                    <button 
                      v-if="canDeleteComment(commento)"
                      @click="eliminaCommento(commento._id)"
                      class="delete-comment-btn"
                      title="Elimina commento"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div class="comment-text">{{ commento.contenuto }}</div>
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
import { PropostaService } from '@/services/PropostaService';
import { UserService } from '@/services/UserService';
import { DateService } from '@/services/DateService';
import { useModal } from '@/composables/useModal';
import type { IProposta } from '@/types/Proposta';
import type { IUser } from '@/types/User';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { showError, showConfirm } = useModal();
const proposta = ref<IProposta | null>(null);
const proponente = ref<IUser | null>(null);

// Stati per i commenti
const commentiProposta = ref<any[]>([]);
const nuovoCommento = ref("");
const isCommentsLoading = ref(false);
const isLoading = ref(false);
const isHyperLoading = ref(false);

// Cache per gli avatar dei commentatori (caricamento asincrono)
const commentUserAvatars = ref<Map<string, string>>(new Map());
const proponenteAvatar = ref<string | null>(null);

// Cache per gli utenti che hanno messo hyper
const hyperUsers = ref<any[]>([]);
const hyperUsersLoading = ref(false);
const hyperUserAvatars = ref<Map<string, string>>(new Map());

// Funzione per caricare gli avatar in modo asincrono
async function loadCommentAvatars() {
  if (!commentiProposta.value?.length) return;
  
  for (const commento of commentiProposta.value) {
    if (commento.utente?._id && !commentUserAvatars.value.has(commento.utente._id)) {
      try {
        const avatarUrl = await UserService.loadUserAvatar(commento.utente._id);
        // Salviamo sempre in cache il risultato (stringa vuota se nessun avatar)
        // Questo eviterà richieste ripetute e il v-if funzionerà correttamente
        commentUserAvatars.value.set(commento.utente._id, avatarUrl || '');
      } catch (error) {
        console.error('❌ Errore nel caricamento avatar per', commento.utente._id, ':', error);
        // Salviamo stringa vuota in caso di errore
        commentUserAvatars.value.set(commento.utente._id, '');
      }
    }
  }
}

// Funzione per caricare l'avatar del proponente
async function loadProponenteAvatar() {
  if (proponente.value?._id) {
    try {
      const avatarUrl = await UserService.loadUserAvatar(proponente.value._id);
      // Impostiamo sempre il valore - se vuoto, il v-if mostrerà il placeholder
      proponenteAvatar.value = avatarUrl || null;
    } catch (error) {
      console.error('❌ Errore nel caricamento avatar proponente:', error);
      proponenteAvatar.value = null;
    }
  }
}

// Funzione per caricare gli utenti che hanno messo hyper
async function loadHyperUsers() {
  if (!proposta.value?.listaHyper?.length) {
    hyperUsers.value = [];
    return;
  }

  hyperUsersLoading.value = true;
  
  try {
    const userPromises = proposta.value.listaHyper.map(async (userId: string) => {
      try {
        const userData = await UserService.loadUser(userId);
        if (userData) {
          // Carica anche l'avatar dell'utente
          try {
            const avatarUrl = await UserService.loadUserAvatar(userId);
            hyperUserAvatars.value.set(userId, avatarUrl || '');
          } catch (avatarError) {
            console.error('❌ Errore nel caricamento avatar hyper user:', avatarError);
            hyperUserAvatars.value.set(userId, '');
          }
          return userData;
        }
        return null;
      } catch (error) {
        console.error('❌ Errore nel caricamento dati utente hyper:', error);
        return null;
      }
    });

    const results = await Promise.all(userPromises);
    hyperUsers.value = results.filter(user => user !== null);
  } catch (error) {
    console.error('❌ Errore nel caricamento utenti hyper:', error);
    hyperUsers.value = [];
  } finally {
    hyperUsersLoading.value = false;
  }
}

// Funzione per ottenere l'avatar di un commentatore
function getCommentUserAvatar(userId?: string): string {
  if (!userId) return '';
  const avatar = commentUserAvatars.value.get(userId);
  // Restituiamo stringa vuota se non c'è avatar o se è stringa vuota
  // Questo farà funzionare correttamente il v-if nel template
  return avatar || '';
}

// Funzione per ottenere l'avatar di un utente hyper
function getHyperUserAvatar(userId?: string): string {
  if (!userId) return '';
  const avatar = hyperUserAvatars.value.get(userId);
  return avatar || '';
}

// Funzione per verificare se l'utente è un ente
function isEnte(user: any): boolean {
  // Verifica prima il campo userType se disponibile
  if (user?.userType) {
    return user.userType === 'ente';
  }
  // Fallback: se non ha cognome probabilmente è un ente
  return user?.nome && !user?.cognome;
}

// Funzione per gestire errori di caricamento avatar
function onAvatarError(event: Event, userId?: string) {
  if (userId) {
    // Rimuovi l'avatar dalla cache così il placeholder verrà mostrato
    commentUserAvatars.value.set(userId, '');
    // Nascondi l'elemento img che ha dato errore
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}

// Funzione per gestire errori di caricamento avatar del proponente
function onProponenteAvatarError(event: Event) {
  // Reset dell'avatar del proponente così il placeholder verrà mostrato
  proponenteAvatar.value = null;
  // Nascondi l'elemento img che ha dato errore
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
}

// Funzione per gestire errori di caricamento avatar dell'utente nel form
function onUserAvatarError(event: Event) {
  // Nascondi l'elemento img che ha dato errore
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  // Il getUserAvatar fallirà al prossimo render e mostrerà il placeholder
}

// Funzione per formattare l'indirizzo completo
function formatAddress(indirizzo: any): string {
  const parts = [];
  if (indirizzo.via) {
    parts.push(`${indirizzo.via}`);
  }
  if (indirizzo.civico) {
    parts.push(`${indirizzo.civico}`);
  }
  return parts.join(', ');
}

// Funzione per formattare l'indirizzo completo con più dettagli
function formatFullAddress(indirizzo: any): string {
  const parts = [];
  if (indirizzo.via) {
    parts.push(`${indirizzo.via}`);
  }
  if (indirizzo.civico) {
    parts.push(`n. ${indirizzo.civico}`);
  }
  return parts.join(', ');
}

// Funzione per processare le immagini (spostata dal service)
function processImageUrl(foto: any): string {
  return PropostaService.processImageUrl(foto);
}

// Funzione per ottenere l'etichetta della categoria (spostata dal service)
function getCategoryLabel(categoria: string): string {
  return PropostaService.getCategoryLabel(categoria);
}

// Funzione per ottenere le iniziali del nome (spostata dal service)
function getInitials(nome?: string, cognome?: string): string {
  return UserService.getInitials(nome, cognome);
}

// Funzione per ottenere il nome completo dell'utente (spostata dal service)
function getFullName(user?: any): string {
  return UserService.getFullName(user);
}

// Funzione per navigare al profilo del creatore
function goToCreatorProfile() {
  if (proponente.value?._id) {
    router.push(`/users/${proponente.value._id}`);
  }
}

// Funzione per processare l'avatar dell'utente (deprecata - ora usa endpoint dedicato)
function getUserAvatar(user: any): string {
  // Per il proponente, usa il caricamento asincrono
  if (user?._id === proponente.value?._id) {
    return proponenteAvatar.value || '';
  }
  
  // Per altri utenti (come nel form commenti), usa il processing diretto
  return UserService.processUserAvatar(user);
}

// Computed per i controlli utente
const canHype = computed(() => userStore.canHype);
const isOperatore = computed(() => userStore.isOperatore);

// Funzione per verificare se l'utente può cancellare un commento
function canDeleteComment(commento: any): boolean {
  if (!userStore.user) return false;
  
  // L'utente può cancellare il proprio commento
  if (commento.utente?._id === userStore.user._id) return true;
  
  // Gli operatori e admin possono cancellare qualsiasi commento
  if (userStore.isOperatore || userStore.isAdmin) return true;
  
  return false;
}

// Computed per hyper
const isHyperUser = computed(() => {
  const listaHyper = proposta.value?.listaHyper;
  return Array.isArray(listaHyper) && listaHyper.includes(userStore.user?._id);
});

const hyperCount = computed(() => {
  return proposta.value?.listaHyper?.length || 0;
});

// Funzione per ottenere il nome dell'utente dai commenti (spostata dal service)
function getUserName(commento: any): string {
  return UserService.getCommentUserName(commento);
}

// Funzione per formattare la data in modo più leggibile (spostata dal service)
function formatDate(dateString: string): string {
  return DateService.formatRelativeDate(dateString);
}

// Funzione per formattare data e ora completa (spostata dal service)
function formatDateTime(dateString: string): string {
  return DateService.formatDateTime(dateString);
}

// Funzioni per i commenti (spostate nel service)
async function caricaCommenti() {
  if (!proposta.value || isCommentsLoading.value) return;
  
  isCommentsLoading.value = true;
  try {
    commentiProposta.value = await PropostaService.loadCommenti(proposta.value._id);
    // Carica gli avatar dei commentatori in modo asincrono
    await loadCommentAvatars();
  } catch (err: any) {
    console.error("Errore nel caricamento commenti:", err);
    commentiProposta.value = [];
    // Mostra messaggio di errore user-friendly
    showError("Errore nel caricamento dei commenti", err.message);
  } finally {
    isCommentsLoading.value = false;
  }
}

async function inviaCommento() {
  if (!nuovoCommento.value.trim() || !proposta.value || !userStore.user?._id || isLoading.value) return;
  
  const commentoTemp = nuovoCommento.value.trim();
  nuovoCommento.value = "";
  isLoading.value = true;
  
  try {
    await PropostaService.inviaCommento(
      proposta.value._id,
      commentoTemp,
      userStore.token
    );
    
    // Ricarica i commenti per mostrare il nuovo commento
    await caricaCommenti();
  } catch (err: any) {
    console.error("Errore commento:", err);
    nuovoCommento.value = commentoTemp; // Ripristina il commento in caso di errore
    showError("Errore nell'invio del commento", err.message);
  } finally {
    isLoading.value = false;
  }
}

// Funzione per eliminare un commento
async function eliminaCommento(commentoId: string) {
  if (!proposta.value || !userStore.token || !commentoId) return;
  
  const result = await showConfirm(
    "Elimina commento",
    "Sei sicuro di voler eliminare questo commento?"
  );
  
  if (!result) return;
  
  try {
    await PropostaService.eliminaCommento(
      proposta.value._id,
      commentoId,
      userStore.token
    );
    
    // Ricarica i commenti per aggiornare la lista
    await caricaCommenti();
  } catch (err: any) {
    console.error("Errore eliminazione commento:", err);
    showError("Errore nell'eliminazione del commento", err.message);
  }
}

// Funzione per gestire l'hyper (spostata nel service)
async function handleHyper() {
  if (!canHype.value || !proposta.value || !userStore.user?._id || isHyperLoading.value) return;
  
  isHyperLoading.value = true;
  
  try {
    const updatedProposta = await PropostaService.toggleHyper(
      proposta.value._id,
      userStore.token
    );
    
    // Aggiorna la proposta con i dati aggiornati
    proposta.value = updatedProposta;
    
    // Ricarica gli utenti hyper dopo l'aggiornamento
    await loadHyperUsers();
    
  } catch (err: any) {
    console.error("Errore hyper:", err);
    showError("Errore nell'aggiunta dell'hyper", err.message);
  } finally {
    isHyperLoading.value = false;
  }
}

// Caricamento iniziale (logica spostata nei service)
onMounted(async () => {
  const propostaId = route.params.id as string;
  if (propostaId) {
    try {
      // Carica la proposta usando il service
      proposta.value = await PropostaService.loadProposta(propostaId);
      
      // Carica il proponente se presente
      if (proposta.value && proposta.value.proponenteID) {
        proponente.value = await UserService.loadUser(proposta.value.proponenteID);
        // Carica l'avatar del proponente in modo asincrono
        await loadProponenteAvatar();
      }
      
      // Carica gli utenti che hanno messo hyper
      await loadHyperUsers();
      
      // Carica i commenti
      await caricaCommenti();
    } catch (error) {
      console.error("Errore nel caricamento della proposta:", error);
      showError("Errore nel caricamento della proposta", "Riprova più tardi.");
    }
  }
});

// Watch per ricaricare i commenti quando cambia la proposta
watch(proposta, (newProposta) => {
  if (newProposta) {
    caricaCommenti();
    loadHyperUsers();
  }
});
</script>

<style scoped>
/* Base styles */
.proposta-view {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-background-soft) 0%, var(--color-background-mute) 100%);
  padding: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-spinner.small {
  width: 30px;
  height: 30px;
  border-width: 3px;
  margin-bottom: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.proposta-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Hero Section */
.hero-section {
  background: var(--color-card-background);
  border-radius: 2rem;
  overflow: hidden;
  box-shadow: 0 8px 40px var(--color-shadow);
  position: relative;
}

.hero-image-container {
  position: relative;
  height: 400px;
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.hero-image:hover {
  transform: scale(1.02);
}

.hero-image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-background-soft), var(--color-background-mute));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.category-hero-badge {
  position: absolute;
  top: 2rem;
  left: 2rem;
  background: rgba(254, 70, 84, 0.95);
  color: #fff;
  padding: 0.8rem 1.5rem;
  border-radius: 2rem;
  font-size: 1rem;
  font-weight: 600;
  backdrop-filter: blur(15px);
  box-shadow: 0 4px 20px rgba(254, 70, 84, 0.4);
  animation: fadeInScale 0.6s ease-out;
}

.back-btn {
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 2rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  backdrop-filter: blur(15px);
  transition: all 0.3s ease;
  animation: fadeInScale 0.6s ease-out 0.2s both;
}

.back-btn:hover {
  background: rgba(254, 70, 84, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(254, 70, 84, 0.4);
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-content {
  padding: 3rem;
}

.proposal-title {
  font-size: 3rem;
  font-weight: 800;
  color: var(--color-heading);
  margin: 0 0 1.5rem 0;
  line-height: 1.2;
}

/* Creator and Hyper Row */
.creator-hyper-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

/* Creator Badge */
.creator-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  background: rgba(254, 70, 84, 0.1);
  border: 1px solid rgba(254, 70, 84, 0.3);
  border-radius: 1.5rem;
  padding: 0.8rem 1.2rem;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}

.creator-badge:hover {
  background: rgba(254, 70, 84, 0.15);
  transform: translateY(-1px);
}

.creator-badge.clickable {
  cursor: pointer;
}

.creator-badge.clickable:hover {
  background: rgba(254, 70, 84, 0.2);
  box-shadow: 0 4px 12px rgba(254, 70, 84, 0.3);
}

.creator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fe4654, #e63946);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1rem;
  font-weight: bold;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(254, 70, 84, 0.3);
}

.creator-avatar .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.creator-avatar .avatar-placeholder {
  text-align: center;
  font-size: 1rem;
  font-weight: bold;
}

.creator-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.creator-label {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.creator-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-primary);
}

/* Hyper Counter Badge */
.hyper-counter-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.hyper-button-container {
  flex-shrink: 0;
}

.hyper-btn {
  font-size: 1.7rem;
  background: var(--color-card-background);
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.hyper-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(254, 70, 84, 0.4);
}

.hyper-btn.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
  box-shadow: 0 0 25px var(--color-primary-light);
  animation: hyperPulse 2s infinite;
}

.hyper-btn:disabled {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
  cursor: not-allowed;
  opacity: 0.8;
}

.hyper-icon {
  filter: drop-shadow(0 0 8px rgba(254, 70, 84, 0.8));
  transition: filter 0.3s ease;
}

.hyper-btn.active .hyper-icon {
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 1));
}

.loading-hourglass {
  animation: rotate 1.5s linear infinite;
  filter: drop-shadow(0 0 8px rgba(254, 70, 84, 0.6));
}

@keyframes hyperPulse {
  0%, 100% {
    box-shadow: 0 0 25px rgba(254, 70, 84, 0.6);
  }
  50% {
    box-shadow: 0 0 35px rgba(254, 70, 84, 0.9);
  }
}

.hyper-disabled-container {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #f5f5f5;
  border: 2px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hyper-icon-disabled {
  font-size: 1.7rem;
  color: #ccc;
}

.hyper-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.hyper-count {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2B2C34;
}

.hyper-disabled-text-compact {
  text-align: center;
}

.hyper-disabled-text-compact small {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-style: italic;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.proposal-description {
  font-size: 1.3rem;
  line-height: 1.8;
  color: var(--color-text);
  margin-bottom: 2.5rem;
  font-weight: 400;
}

/* Proposal Details Section */
.proposal-details-section {
  margin-bottom: 2rem;
}

.details-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.details-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.detail-item {
  background: var(--color-background-soft);
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
  min-width: 200px;
  flex: 1;
}

.detail-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border-color: rgba(254, 70, 84, 0.3);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.7rem;
}

.detail-icon {
  font-size: 1.1rem;
  opacity: 0.8;
}

.detail-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.detail-primary {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  line-height: 1.3;
  word-wrap: break-word;
}

.detail-primary.detail-tbd {
  color: var(--color-text-secondary);
  font-style: italic;
}

.detail-secondary {
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.9;
}

.detail-badge {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  background: rgba(254, 70, 84, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 0.8rem;
  align-self: flex-start;
  font-weight: 500;
  margin-top: 0.2rem;
}

/* Simplified Meta Info */
.proposal-meta-simple {
  display: flex;
  justify-content: flex-end;
}

.creation-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-card-background);
  padding: 0.6rem 1.2rem;
  border-radius: 2rem;
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.creation-badge:hover {
  background: var(--color-background-soft);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.creation-badge .meta-icon {
  font-size: 1rem;
  opacity: 0.8;
}

.creation-badge .meta-text {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

/* Compact Meta Info - Kept for backwards compatibility but now unused */
.proposal-meta-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-card-background);
  padding: 0.5rem 1rem;
  border-radius: 1.5rem;
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.meta-item:hover {
  background: var(--color-background-soft);
  transform: translateY(-1px);
  box-shadow: 0 2px 10px var(--color-shadow);
}

.meta-item.location-item {
  align-items: flex-start;
  padding: 0.8rem 1.2rem;
}

.location-details {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.location-primary {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

.location-secondary {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.location-cap {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  background: rgba(254, 70, 84, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 0.8rem;
  align-self: flex-start;
  font-weight: 500;
}

.meta-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.meta-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
}

/* Comments Section */
.comments-section {
  background: var(--color-card-background);
  border-radius: 2rem;
  padding: 3rem;
  box-shadow: 0 8px 40px var(--color-shadow);
  animation: fadeInUp 0.6s ease-out 0.5s both;
}

/* Hyper Users Section */
.hyper-users-section {
  background: var(--color-card-background);
  border-radius: 2rem;
  padding: 2.5rem;
  box-shadow: 0 8px 40px var(--color-shadow);
  animation: fadeInUp 0.6s ease-out 0.4s both;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-background-soft);
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  font-size: 2rem;
  filter: drop-shadow(0 0 8px rgba(254, 70, 84, 0.6));
}

.hyper-count-badge {
  background: linear-gradient(135deg, #fe4654, #e63946);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

.loading-hyper-users {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}

.hyper-users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.hyper-user-card {
  background: var(--color-background-soft);
  border-radius: 1.5rem;
  padding: 1.5rem;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hyper-user-card:hover {
  background: var(--color-background-mute);
  border-color: rgba(254, 70, 84, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
}

.hyper-user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(254, 70, 84, 0.3);
}

.hyper-user-avatar .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.hyper-user-avatar .avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #fe4654, #e63946);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 1.2rem;
}

.hyper-user-info {
  flex: 1;
  min-width: 0;
}

.hyper-user-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 0.3rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hyper-user-type {
  font-size: 0.8rem;
  color: var(--color-primary);
  background: rgba(254, 70, 84, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.hyper-user-bio {
  font-size: 0.85rem;
  color: var(--color-text);
  line-height: 1.4;
  margin: 0.5rem 0 0 0;
  opacity: 0.8;
}

.no-enti-hyper {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
}

.no-enti-hyper .empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
  display: block;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--color-background-soft);
}

.comments-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
}

.comments-count {
  background: linear-gradient(135deg, #fe4654, #e63946);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Comment Form */
.comment-form-section {
  background: var(--color-background-soft);
  border-radius: 1.5rem;
  padding: 2rem;
  margin-bottom: 3rem;
}

.comment-form {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.comment-author-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fe4654, #e63946);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.2rem;
  font-weight: bold;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(254, 70, 84, 0.3);
  overflow: hidden;
}

.comment-author-avatar .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.comment-author-avatar .avatar-placeholder {
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
}

.comment-input-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-textarea {
  width: 100%;
  padding: 1rem 1.5rem;
  border: 2px solid var(--color-input-border);
  border-radius: 1.5rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.3s ease;
  background: var(--color-input-background);
  color: var(--color-text);
}

.comment-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}

.comment-submit-btn {
  align-self: flex-end;
  background: linear-gradient(135deg, #fe4654, #e63946);
  color: #fff;
  border: none;
  padding: 1rem 2rem;
  border-radius: 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(254, 70, 84, 0.3);
}

.comment-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(254, 70, 84, 0.4);
}

.comment-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.keyboard-hint {
  color: #6c757d;
  font-style: italic;
  text-align: right;
}

/* Login Reminder */
.login-reminder-card {
  background: linear-gradient(135deg, #f8f9fa, #fff);
  border: 2px dashed #fe4654;
  border-radius: 1.5rem;
  padding: 3rem;
  text-align: center;
  margin-bottom: 3rem;
}

.login-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.login-text h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.login-text p {
  color: #6c757d;
  margin-bottom: 2rem;
}

.login-btn {
  display: inline-block;
  background: linear-gradient(135deg, #fe4654, #e63946);
  color: #fff;
  text-decoration: none;
  padding: 1rem 2rem;
  border-radius: 2rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(254, 70, 84, 0.3);
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(254, 70, 84, 0.4);
}

/* Operator Restriction */
.operator-restriction-card {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border: 2px dashed #ffc107;
  border-radius: 1.5rem;
  padding: 3rem;
  text-align: center;
  margin-bottom: 3rem;
}

.restriction-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.restriction-text h3 {
  color: #856404;
  margin-bottom: 0.5rem;
}

.restriction-text p {
  color: #856404;
  margin-bottom: 0;
  opacity: 0.8;
}

/* Comments List */
.comments-container {
  margin-top: 2rem;
}

.loading-comments {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  color: #6c757d;
}

.no-comments {
  text-align: center;
  padding: 4rem;
  color: var(--color-text-secondary);
}

.no-comments .empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.no-comments h3 {
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment-item {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  padding: 1.5rem;
  background: var(--color-background-soft);
  border-radius: 1.5rem;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.comment-item:hover {
  background: var(--color-background-mute);
  border-left-color: var(--color-primary);
  transform: translateX(5px);
}

.comment-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c757d, #495057);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.2rem;
  font-weight: bold;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
  overflow: hidden;
}

.comment-avatar .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.comment-avatar .avatar-placeholder {
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.comment-author {
  font-weight: 700;
  color: var(--color-heading);
  font-size: 1rem;
}

.comment-date {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
}

.delete-comment-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 50%;
  transition: all 0.3s ease;
  opacity: 0.6;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.delete-comment-btn:hover {
  background: rgba(254, 70, 84, 0.1);
  opacity: 1;
  transform: scale(1.1);
}

.comment-text {
  color: var(--color-text);
  line-height: 1.6;
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .proposta-container {
    padding: 1rem;
    gap: 1.5rem;
  }
  
  .hero-image-container {
    height: 250px;
  }
  
  .category-hero-badge,
  .back-btn {
    top: 1rem;
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
  }
  
  .category-hero-badge {
    left: 1rem;
  }
  
  .back-btn {
    right: 1rem;
  }
  
  .hero-content {
    padding: 2rem;
  }
  
  .proposal-title {
    font-size: 2rem;
  }
  
  .creator-hyper-row {
    flex-direction: column;
    gap: 1.5rem;
    align-items: flex-start;
  }
  
  .hyper-counter-badge {
    align-items: flex-start;
  }
  
  .creator-badge {
    padding: 0.6rem 1rem;
    gap: 0.6rem;
  }
  
  .creator-avatar {
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }
  
  .creator-name {
    font-size: 0.85rem;
  }
  
  .proposal-description {
    font-size: 1.1rem;
  }
  
  .details-title {
    font-size: 1.2rem;
    margin-bottom: 0.8rem;
  }
  
  .details-compact {
    flex-direction: column;
    gap: 1rem;
  }
  
  .detail-item {
    padding: 0.8rem;
    min-width: auto;
  }
  
  .detail-header {
    gap: 0.4rem;
    margin-bottom: 0.5rem;
  }
  
  .detail-icon {
    font-size: 1rem;
  }
  
  .detail-label {
    font-size: 0.8rem;
  }
  
  .detail-primary {
    font-size: 0.95rem;
    line-height: 1.4;
  }
  
  .detail-secondary {
    font-size: 0.85rem;
  }
  
  .detail-badge {
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
  }
  
  .proposal-meta-simple {
    justify-content: center;
  }
  
  .creation-badge {
    padding: 0.5rem 1rem;
  }
  
  .creation-badge .meta-text {
    font-size: 0.8rem;
  }
  
  .hyper-users-section {
    padding: 2rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .hyper-users-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .hyper-user-card {
    padding: 1rem;
  }
  
  .hyper-user-avatar {
    width: 50px;
    height: 50px;
  }
  
  .comments-section {
    padding: 2rem;
  }
  
  .comments-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .comment-form {
    flex-direction: column;
    gap: 1rem;
  }
  
  .comment-author-avatar {
    align-self: center;
  }
  
  .comment-item {
    gap: 1rem;
    padding: 1rem;
  }
  
  .comment-avatar {
    width: 45px;
    height: 45px;
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .hero-content {
    padding: 1.5rem;
  }
  
  .proposal-title {
    font-size: 1.8rem;
  }
  
  .proposal-title {
    font-size: 1.8rem;
  }
  
  .creator-badge {
    padding: 0.5rem 0.8rem;
    gap: 0.5rem;
  }
  
  .creator-avatar {
    width: 30px;
    height: 30px;
    font-size: 0.8rem;
  }
  
  .creator-label {
    font-size: 0.6rem;
  }
  
  .creator-name {
    font-size: 0.8rem;
  }
  
  .details-title {
    font-size: 1.1rem;
    margin-bottom: 0.7rem;
  }
  
  .detail-item {
    padding: 0.7rem;
  }
  
  .detail-header {
    gap: 0.3rem;
    margin-bottom: 0.4rem;
  }
  
  .detail-icon {
    font-size: 0.9rem;
  }
  
  .detail-label {
    font-size: 0.75rem;
  }
  
  .detail-primary {
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .detail-secondary {
    font-size: 0.8rem;
  }
  
  .detail-badge {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
  }
  
  .hyper-users-section {
    padding: 1.5rem;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .section-title {
    font-size: 1.3rem;
  }
  
  .hyper-user-card {
    padding: 0.8rem;
  }
  
  .hyper-user-avatar {
    width: 45px;
    height: 45px;
  }
  
  .hyper-user-name {
    font-size: 1rem;
  }
  
  .creation-badge {
    padding: 0.4rem 0.8rem;
  }
  
  .creation-badge .meta-icon {
    font-size: 0.9rem;
  }
  
  .creation-badge .meta-text {
    font-size: 0.75rem;
  }
  
  .proposal-meta-compact {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
  }
  
  .meta-item {
    padding: 0.3rem 0.6rem;
  }
  
  .meta-item.location-item {
    padding: 0.5rem 0.8rem;
  }
  
  .location-primary {
    font-size: 0.8rem;
  }
  
  .location-secondary {
    font-size: 0.7rem;
  }
  
  .location-cap {
    font-size: 0.65rem;
    padding: 0.1rem 0.4rem;
  }
  
  .meta-icon {
    font-size: 1rem;
  }
  
  .meta-text {
    font-size: 0.75rem;
  }
  
  .hyper-section-youtube {
    padding: 0 1.5rem;
  }
  
  .comments-section {
    padding: 1.5rem;
  }
}
</style>
