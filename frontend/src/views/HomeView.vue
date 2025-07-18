<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import axios from 'axios'
import type { IProposta } from "../types/Proposta"
import { useUserStore } from '@/stores/userStore'

// Stato di caricamento
const isLoading = ref(false)
const isCommentsLoading = ref(false)
const isHyperLoading = ref(false)

// Funzione locale per gestire la visualizzazione delle immagini
function processImageUrl(foto: any): string {
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
    console.error('Errore nella conversione dell\'immagine:', e);
  }
  
  return '';
}

// CATEGORIE
const categorie = [
  { label: "Cultura", value: "cultura" },
  { label: "Concerti", value: "concerti" },
  { label: "Mostre e installazioni", value: "mostreInstallazioni" },
  { label: "Sport", value: "sport" },
  { label: "Workshop e corsi", value: "workshopCorsi" },
  { label: "Conferenze", value: "conferenze" }
]

const categoriaSelezionata = ref<string | null>(null)
const proposte = ref<IProposta[]>([])
const selected = ref<'classifica' | 'esplora'>('esplora')
const userStore = useUserStore()

// Stato per controllare la visibilità del banner
const showBanner = ref(true)

function closeBanner() {
  showBanner.value = false
}

// PROPOSTE FILTRATE PER CATEGORIA
const proposteFiltrate = computed(() =>
  categoriaSelezionata.value
    ? proposte.value.filter(p => p.categoria === categoriaSelezionata.value)
    : proposte.value
)

// CLASSIFICA - proposte ordinate per numero di hyper
const classificaProposte = computed(() => {
  return [...proposte.value]
    .sort((a, b) => (b.listaHyper?.length || 0) - (a.listaHyper?.length || 0))
    .slice(0, 10) // Top 10
})

// Controlli per tipo utente (ora utilizzano i getter dello store)
const isOperatore = computed(() => userStore.isOperatore)
const isAmministratore = computed(() => userStore.isAdmin)
const canHype = computed(() => userStore.canHype)

// LOGICA PER I COMMENTI
const commentiProposta = ref<any[]>([])
const nuovoCommento = ref("")

async function caricaCommenti() {
  if (!propostaSelezionata.value || isCommentsLoading.value) return;
  
  isCommentsLoading.value = true
  try {
    const res = await axios.get(
      `http://localhost:3000/api/proposte/${encodeURIComponent(propostaSelezionata.value.titolo)}/commenti`,
      {
        headers: userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {}
      }
    );
    commentiProposta.value = res.data.commenti || [];
  } catch (err: any) {
    console.error("Errore nel caricamento commenti:", err);
    commentiProposta.value = [];
    if (err.response?.status === 401) {
      console.log("Utente non autenticato per visualizzare i commenti");
    }
  } finally {
    isCommentsLoading.value = false
  }
}

async function inviaCommento() {
  if (!nuovoCommento.value.trim() || !propostaSelezionata.value || !userStore.user?._id || isLoading.value) return;
  
  const commentoTemp = nuovoCommento.value.trim()
  nuovoCommento.value = ""
  isLoading.value = true
  
  try {
    await axios.post(
      `http://localhost:3000/api/proposte/${encodeURIComponent(propostaSelezionata.value.titolo)}/commenti`,
      {
        contenuto: commentoTemp,
        userId: userStore.user._id,
      },
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`
        }
      }
    );
    
    await caricaCommenti();
  } catch (err: any) {
    console.error("Errore commento:", err);
    nuovoCommento.value = commentoTemp // Ripristina il commento in caso di errore
    if (err.response?.status === 401) {
      alert("Sessione scaduta. Effettua nuovamente il login.");
    } else {
      alert("Errore nell'invio del commento");
    }
  } finally {
    isLoading.value = false
  }
}

// PROPOSTA DA APRIRE SULLA DESTRA
const propostaSelezionata = ref<IProposta | null>(null);

async function apriDettaglio(proposta: IProposta) {
  propostaSelezionata.value = proposta;
  commentiProposta.value = []; // Reset commenti
  await caricaCommenti();
}

function chiudiDettaglio() {
  propostaSelezionata.value = null;
  commentiProposta.value = [];
}

// LOGICA PER IL BOTTONE HYPE
const isHyperUser = computed(() => {
  const listaHyper = propostaSelezionata.value?.listaHyper;
  return Array.isArray(listaHyper) && listaHyper.includes(userStore.user?._id);
})

const hyperCount = computed(() => {
  return propostaSelezionata.value?.listaHyper?.length || 0;
})

async function handleHyper() {
  if (!canHype.value || !propostaSelezionata.value || !userStore.user?._id || isHyperLoading.value) return;
  
  isHyperLoading.value = true
  
  try {
    const res = await axios.patch(
      `http://localhost:3000/api/proposte/${encodeURIComponent(propostaSelezionata.value.titolo)}/hyper`,
      { userId: userStore.user._id },
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`
        }
      }
    );
    
    // Aggiorna la proposta selezionata
    propostaSelezionata.value = res.data;
    
    // Aggiorna anche la proposta nella lista
    const index = proposte.value.findIndex(p => p.titolo === propostaSelezionata.value!.titolo);
    if (index !== -1) {
      proposte.value[index] = res.data;
    }
  } catch (err: any) {
    console.error("Errore hyper:", err);
    if (err.response?.status === 401) {
      alert("Sessione scaduta. Effettua nuovamente il login.");
    } else if (err.response?.status === 403) {
      alert("Non hai il permesso di mettere hyper.");
    } else {
      alert("Errore nell'aggiunta dell'hyper");
    }
  } finally {
    isHyperLoading.value = false
  }
}

// Funzione per ottenere il badge dell'utente (disabilitata)
function getUserBadge(commento: any) {
  return ''; // Nessun badge per tutti gli utenti
}

// Funzione per ottenere il nome dell'utente
function getUserName(commento: any) {
  if (!commento.utente) return 'Utente';
  return `${commento.utente.nome || ''} ${commento.utente.cognome || ''}`.trim() || 'Utente';
}

onMounted(async () => {
  isLoading.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/proposte')
    proposte.value = res.data
  } catch (error) {
    console.error('Errore nel recupero proposte:', error)
  } finally {
    isLoading.value = false
  }
})

// Watch per ricaricare i commenti quando cambia la proposta selezionata
watch(propostaSelezionata, (newProposta) => {
  if (newProposta) {
    caricaCommenti()
  }
})
</script>

<template>
  <div class="home-container">
    <!-- Banner per utenti non loggati -->
    <div v-if="!userStore.user && showBanner" class="welcome-banner">
      <button class="banner-close-btn" @click="closeBanner">×</button>
      <div class="banner-content" @click="$router.push('/not-logged')">
        <div class="banner-icon">🎪</div>
        <div class="banner-text">
          <h3>Scopri tutto quello che InCrowd ha da offrire!</h3>
          <div class="banner-bottom-row">
            <p>Registrati gratis e unisciti alla community</p>
            <div class="banner-cta">
              <span class="cta-text">Scopri di più →</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="toggle-bar">
      <button
        :class="{ active: selected === 'classifica' }"
        @click="selected = 'classifica'"
      >
        Classifica
      </button>
      <button
        :class="{ active: selected === 'esplora' }"
        @click="selected = 'esplora'"
      >
        Esplora
      </button>
    </div>

    <div class="toggle-content">
      <div v-if="selected === 'classifica'">
        <div class="classifica-header">
          <h2>🏆 Classifica Top 10</h2>
        </div>
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Caricamento classifica...</p>
        </div>
        <div v-else class="classifica-container">
          <div v-if="classificaProposte.length === 0" class="empty-state">
            <div class="empty-icon">🏆</div>
            <h3>Nessuna proposta ancora</h3>
            <p>Le proposte più hypate appariranno qui</p>
          </div>
          <div v-else class="classifica-list">
            <div 
              v-for="(proposta, index) in classificaProposte" 
              :key="proposta.titolo"
              class="classifica-item"
              :class="{ 
                'first-place': index === 0,
                'second-place': index === 1,
                'third-place': index === 2
              }"
              @click="apriDettaglio(proposta)"
            >
              <div class="classifica-position">
                <span class="position-number" :class="{ 
                  'gold': index === 0, 
                  'silver': index === 1, 
                  'bronze': index === 2 
                }">
                  {{ index + 1 }}
                </span>
                <span v-if="index === 0" class="crown">👑</span>
              </div>
              <div class="classifica-image">
                <img
                  v-if="proposta.foto"
                  :src="processImageUrl(proposta.foto)"
                  alt="Immagine proposta"
                  class="classifica-img"
                />
                <div v-else class="classifica-img-placeholder">📸</div>
              </div>
              <div class="classifica-info">
                <h3 class="classifica-title">{{ proposta.titolo }}</h3>
                <p class="classifica-categoria">{{ proposta.categoria }}</p>
                <p class="classifica-description">{{ proposta.descrizione?.substring(0, 100) }}...</p>
              </div>
              <div class="classifica-hyper">
                <span class="hyper-icon">⚡</span>
                <span class="hyper-number">{{ proposta.listaHyper?.length || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <!--SEZIONE ESPLORA-->
        <!--sezione categorie-->
        <div class="categorie-section">
          <h2 class="categorie-title">Categorie</h2>
          <div class="categorie-list">
            <button
              :class="['categoria-btn', { selected: categoriaSelezionata === null }]"
              @click="categoriaSelezionata = null"
            >Tutte
            </button>
            <button
              v-for="cat in categorie"
              :key="cat.value"
              :class="['categoria-btn', { selected: categoriaSelezionata === cat.value }]"
              @click="categoriaSelezionata = cat.value"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!--sezione nuove proposte--> 
        <h2>Nuove Proposte</h2>
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Caricamento proposte...</p>
        </div>
        <div v-else>
          <div class="proposte-grid"  
              :class="{ 'with-panel': propostaSelezionata }">
              <div
                  v-for="proposta in proposteFiltrate"
                  :key="proposta.titolo"
                  class="proposta-card"
                  @click="apriDettaglio(proposta)"
                  style="cursor:pointer"
                >
                    <img
                      v-if="proposta.foto"
                      :src="processImageUrl(proposta.foto)"
                      alt="Immagine proposta"
                      class="proposta-img"
                    />
                    
                    <div class="proposta-title">{{ proposta.titolo }}</div>
                  </div>
                </div>
                <p v-if="!isLoading && !proposteFiltrate.length">Nessuna proposta trovata.</p>
        </div>
      </div>
    </div>

    <!-- Side panel per il dettaglio proposta -->
    <Transition name="slide-panel">
      <div
        v-if="propostaSelezionata"
        class="side-panel"
        :class="{ 'side-panel--open': propostaSelezionata }"
      >
        <button class="close-btn" @click="chiudiDettaglio">×</button>
        
        <!-- Header della proposta -->
        <div class="proposal-header-card">
          <img
            v-if="propostaSelezionata.foto"
            :src="processImageUrl(propostaSelezionata.foto)"
            alt="Immagine proposta"
            class="proposal-image"
          />
          <div v-else class="proposal-image-placeholder">
            <span>📸</span>
          </div>
          
          <div class="proposal-info">
            <h2 class="proposal-title">{{ propostaSelezionata.titolo }}</h2>
            <span class="proposal-category-badge">{{ propostaSelezionata.categoria }}</span>
            <p class="proposal-description">{{ propostaSelezionata.descrizione }}</p>
          </div>
        </div>

        <!-- Sezione Hyper -->
        <div class="hyper-card">
          <div class="hyper-row">
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
              <small v-if="!canHype && isOperatore" class="hyper-disabled-text">
                Gli operatori non possono mettere hyper
              </small>
              <small v-else-if="!canHype" class="hyper-disabled-text">
                Effettua il login per mettere hyper
              </small>
            </div>
          </div>
        </div>

        <!-- Sezione Commenti -->
        <div class="comments-card">
          <h3 class="comments-title">💬 Commenti</h3>
          
          <div v-if="!userStore.user" class="login-reminder">
            <small>Loggati per aggiungere commenti</small>
          </div>
          
          <div v-else class="comment-form">
            <div class="comment-input-container">
              <input
                v-model="nuovoCommento"
                @keyup.enter="inviaCommento"
                :disabled="isLoading"
                placeholder="Scrivi un commento..."
                class="comment-input"
                type="text"
              />
              <button 
                @click="inviaCommento" 
                :disabled="isLoading || !nuovoCommento.trim()"
                class="comment-send-btn"
                title="Invia commento"
              >
                <span v-if="!isLoading" class="send-icon">▶</span>
                <span v-else class="loading-dots">●●●</span>
              </button>
            </div>
          </div>
          
          <div class="comments-list" :class="{ 'with-login-reminder': !userStore.user }">
            <div v-if="isCommentsLoading" class="loading-comments">
              <div class="loading-spinner small"></div>
              <small>Caricamento commenti...</small>
            </div>
            <div v-else-if="commentiProposta.length === 0" class="no-comments">
              <div class="empty-icon">💭</div>
              <small>Nessun commento ancora. Sii il primo a commentare!</small>
            </div>
            <div v-else class="comments-scroll">
              <div v-for="commento in commentiProposta" :key="commento._id" class="comment-item">
                <div class="comment-header">
                  <span class="comment-author">{{ getUserName(commento) }}</span>
                </div>
                <div class="comment-content">{{ commento.contenuto }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Base styles */
ul {
  list-style-type: none;
  padding: 0;
}

/* Welcome Banner for non-logged users */
.welcome-banner {
  background: linear-gradient(135deg, #fe4654 0%, #404149 100%);
  border-radius: 1rem;
  margin: 0.5rem auto 1rem auto;
  max-width: 800px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(254, 70, 84, 0.3);
  overflow: hidden;
  position: relative;
}

.banner-close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.8rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.banner-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.welcome-banner:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(254, 70, 84, 0.4);
}

.welcome-banner:hover::before {
  left: 100%;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1rem 1.5rem;
  color: #fff;
  position: relative;
  z-index: 1;
}

.banner-icon {
  font-size: 2rem;
  flex-shrink: 0;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
  60% {
    transform: translateY(-4px);
  }
}

.banner-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.banner-text h3 {
  margin: 0 0 0.3rem 0;
  font-size: 1.1rem;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.banner-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.banner-text p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.9rem;
  flex: 1;
}

.banner-cta {
  flex-shrink: 0;
}

.cta-text {
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(255,255,255,0.2);
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  white-space: nowrap;
  transition: background 0.3s ease;
  display: inline-block;
}

.welcome-banner:hover .cta-text {
  background: rgba(255,255,255,0.3);
}

/* Responsive banner */
@media (max-width: 768px) {
  .welcome-banner {
    margin: 0.5rem;
    max-width: none;
  }
  
  .banner-content {
    padding: 0.8rem 1.2rem;
    gap: 1rem;
  }
  
  .banner-icon {
    font-size: 1.8rem;
  }
  
  .banner-text h3 {
    font-size: 1rem;
  }
  
  .banner-bottom-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .banner-text p {
    font-size: 0.85rem;
  }
  
  .cta-text {
    font-size: 0.75rem;
    padding: 0.25rem 0.6rem;
  }
  
  .banner-close-btn {
    top: 0.3rem;
    right: 0.5rem;
    font-size: 1.3rem;
    width: 25px;
    height: 25px;
  }
}

/* Loading States */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #fe4654;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
  margin-bottom: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Toggle Bar */
.toggle-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.toggle-bar button {
  padding: 0.5rem 2rem;
  border: none;
  background: #e6e6e6;
  color: #404149;
  font-size: 1.1rem;
  border-radius: 2rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.toggle-bar button.active {
  background: #fe4654;
  color: #fff;
  font-weight: bold;
}

/* Classifica Styles */
.classifica-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem 1.5rem;
  background: linear-gradient(135deg, #fe4654 0%, #404149 100%);
  border-radius: 1.5rem;
  margin: 0 1.5rem 2rem 1.5rem;
  box-shadow: 0 4px 20px rgba(254, 70, 84, 0.3);
}

.classifica-header h2 {
  color: #fff;
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.classifica-container {
  max-width: 800px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background: #fff;
  border-radius: 1.2rem;
  margin: 1.5rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-state h3 {
  color: #404149;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
  margin: 0;
}

.classifica-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1.5rem;
}

.classifica-item {
  background: #fff;
  border-radius: 1.2rem;
  padding: 1.5rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s, filter 0.3s;
  position: relative;
}

.classifica-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
}

/* Stili speciali per i primi 3 posti */
.classifica-item.first-place {
  transform: scale(1.05);
  box-shadow: 0 8px 32px rgba(254, 70, 84, 0.4);
  animation: firstPlaceBounce 3s ease-in-out infinite;
  border: 2px solid #ffd700;
}

.classifica-item.first-place:hover {
  transform: scale(1.05) translateY(-3px);
  box-shadow: 0 12px 40px rgba(254, 70, 84, 0.6);
}

.classifica-item.second-place {
  box-shadow: 0 6px 24px rgba(192, 192, 192, 0.4);
  filter: drop-shadow(0 0 15px rgba(192, 192, 192, 0.6));
}

.classifica-item.third-place {
  box-shadow: 0 4px 20px rgba(205, 127, 50, 0.4);
  filter: drop-shadow(0 0 10px rgba(205, 127, 50, 0.5));
}

@keyframes firstPlaceBounce {
  0%, 100% {
    transform: scale(1.05) translateY(0);
  }
  50% {
    transform: scale(1.05) translateY(-8px);
  }
}

.classifica-position {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.position-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #404149;
  background: #f0f0f0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.position-number.gold {
  background: linear-gradient(135deg, #ffd700, #ffed4a);
  color: #fff;
}

.position-number.silver {
  background: linear-gradient(135deg, #c0c0c0, #e5e5e5);
  color: #404149;
}

.position-number.bronze {
  background: linear-gradient(135deg, #cd7f32, #daa520);
  color: #fff;
}

.crown {
  font-size: 1.2rem;
  margin-top: 0.2rem;
}

.classifica-image {
  flex-shrink: 0;
}

.classifica-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 1rem;
}

.classifica-img-placeholder {
  width: 80px;
  height: 80px;
  background: #f0f0f0;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #666;
}

.classifica-info {
  flex: 1;
}

.classifica-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #404149;
  margin: 0 0 0.3rem 0;
}

.classifica-categoria {
  color: #fe4654;
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.classifica-description {
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.classifica-hyper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.8rem;
  background: #fe4654;
  border-radius: 1rem;
  color: #fff;
}

.classifica-hyper .hyper-icon {
  font-size: 1.5rem;
}

.classifica-hyper .hyper-number {
  font-size: 1.1rem;
  font-weight: bold;
}

/* Categorie Styles */
.categorie-section {
  margin: 2rem 0 1rem 0;
}

.categorie-title {
  margin-bottom: 0.7rem;
}

.categorie-list {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.categoria-btn {
  background: #fff;
  border: 2px solid #404149;
  color: #404149;
  border-radius: 2rem;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border 0.2s;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.categoria-btn.selected,
.categoria-btn:hover {
  background: #fe4654;
  color: #fff;
  border-color: #fe4654;
}

/* Proposte Grid */
.proposte-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.proposta-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  padding: 1rem;
  width: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: box-shadow 0.2s;
}

.proposta-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}

.proposta-img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 0.7rem;
  margin-bottom: 0.7rem;
  background: #eee;
}

.proposta-title {
  font-weight: bold;
  text-align: center;
  color: #404149;
}

.proposte-grid.with-panel {
  margin-right: 400px;
  transition: margin-right 0.3s;
}

/* Side Panel Styles */
.side-panel {
  position: fixed;
  top: 6rem;
  right: 1rem;
  width: 380px;
  height: 80vh;
  background: #f8f7f3;
  box-shadow: -2px 0 16px rgba(0,0,0,0.12);
  z-index: 200;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: #404149;
  transform: translateX(100%);
  opacity: 0;
  transition: transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.25s;
  border-radius: 1rem;
}

.side-panel--open {
  transform: translateX(0);
  opacity: 1;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 2rem;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 10;
}

/* Proposal Header Card */
.proposal-header-card {
  background: #fff;
  border-radius: 1.2rem;
  padding: 1.5rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
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
  color: #666;
  margin-bottom: 1rem;
}

.proposal-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: #404149;
  margin: 0 0 0.8rem 0;
  line-height: 1.3;
}

.proposal-category-badge {
  background: #fe4654;
  color: #fff;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 1rem;
}

.proposal-description {
  color: #666;
  line-height: 1.5;
  margin: 0;
}

/* Hyper Card */
.hyper-card {
  background: #fff;
  border-radius: 1.2rem;
  padding: 1.5rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
}

.hyper-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hyper-button-container {
  flex-shrink: 0;
}

.hyper-btn {
  font-size: 1.7rem;
  background: #fff;
  border: 2px solid #fe4654;
  color: #fe4654;
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
  background: #fe4654;
  color: #fff;
  border-color: #fe4654;
  box-shadow: 0 0 25px rgba(254, 70, 84, 0.6);
  animation: hyperPulse 2s infinite;
}

.hyper-btn:disabled {
  background: #fe4654;
  color: #fff;
  border-color: #fe4654;
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

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.hyper-count {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fe4654;
}

.hyper-disabled-text {
  color: #999;
  font-size: 0.85rem;
  line-height: 1.2;
}

/* Comments Card */
.comments-card {
  background: #fff;
  border-radius: 1.2rem;
  padding: 1.5rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.comments-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #404149;
  margin: 0 0 1rem 0;
}

.login-reminder {
  text-align: center;
  padding: 1rem;
  background: #f8f7f3;
  border-radius: 1rem;
  color: #666;
  font-style: italic;
}

.comment-form {
  margin-bottom: 1rem;
}

.comment-input-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.comment-input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 1.5rem;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
  box-sizing: border-box;
}

.comment-input:focus {
  border-color: #fe4654;
}

.comment-send-btn {
  background: #fe4654;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

.comment-send-btn:hover:not(:disabled) {
  background: #404149;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(64, 65, 73, 0.4);
}

.comment-send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.send-icon {
  margin-left: 2px; /* Piccolo offset per centrare visivamente la freccia */
}

.loading-dots {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.comment-btn {
  align-self: flex-end;
  background: #fe4654;
  color: #fff;
  border: none;
  border-radius: 1rem;
  padding: 0.6rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.comment-btn:hover:not(:disabled) {
  background: #404149;
}

.comment-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.comments-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.comments-list.with-login-reminder {
  margin-top: 1rem;
}

.loading-comments {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: #666;
}

.no-comments {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.comments-scroll {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 0.5rem;
}

.comment-item {
  background: #f8f7f3;
  border-radius: 1rem;
  padding: 1rem;
  transition: background 0.2s;
}

.comment-item:hover {
  background: #f0f0f0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.comment-author {
  font-weight: bold;
  color: #fe4654;
  font-size: 0.9rem;
}

.comment-content {
  color: #404149;
  line-height: 1.4;
  font-size: 0.95rem;
}

/* Transitions */
.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-panel-enter-to,
.slide-panel-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.25s;
}

/* Scrollbar styling */
.comments-scroll::-webkit-scrollbar {
  width: 6px;
}

.comments-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.comments-scroll::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.comments-scroll::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
