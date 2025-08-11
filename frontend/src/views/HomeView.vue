<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import type { IProposta } from "../types/Proposta"
import { useUserStore } from '@/stores/userStore'
import { 
  searchProposte, 
  type SearchFilters, 
  getAllProposte, 
  getCommenti, 
  addCommento, 
  toggleHyperProposta 
} from '@/api/propostaApi'

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
// const categorie = [
//   { label: "Cultura", value: "cultura" },
//   { label: "Concerti", value: "concerti" },
//   { label: "Mostre e installazioni", value: "mostreInstallazioni" },
//   { label: "Sport", value: "sport" },
//   { label: "Workshop e corsi", value: "workshopCorsi" },
//   { label: "Conferenze", value: "conferenze" }
// ]

const categoriaSelezionata = ref<string | null>(null)
const proposte = ref<IProposta[]>([])
const selected = ref<'classifica' | 'esplora'>('esplora')
const userStore = useUserStore()

// Stato per la ricerca
const searchQuery = ref('')
const showFilters = ref(false)
const isSearching = ref(false)
const searchResults = ref<IProposta[]>([])
const searchExecuted = ref(false)

const searchFilters = ref<SearchFilters>({
  categoria: '',
  citta: '',
  stato: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  limit: 20,
  skip: 0
})

// Stato per controllare la visibilità del banner
const showBanner = ref(true)

function closeBanner() {
  showBanner.value = false
}

// PROPOSTE FILTRATE PER CATEGORIA E RICERCA
const proposteFiltrate = computed(() => {
  // Se c'è una ricerca attiva, mostra i risultati della ricerca
  if (searchExecuted.value && (searchQuery.value || hasActiveFilters.value)) {
    return searchResults.value
  }
  
  // Altrimenti filtra per categoria se selezionata
  return categoriaSelezionata.value
    ? proposte.value.filter(p => p.categoria === categoriaSelezionata.value)
    : proposte.value
})

// Computed unificato per gestire tutte le visualizzazioni
const proposteVisualizzate = computed(() => {
  if (selected.value === 'classifica') {
    return classificaProposte.value
  }
  
  return proposteFiltrate.value
})

// Computed per verificare se ci sono filtri attivi
const hasActiveFilters = computed(() => {
  return searchQuery.value || 
         searchFilters.value.categoria || 
         searchFilters.value.citta || 
         searchFilters.value.stato
})

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
    const data = await getCommenti(propostaSelezionata.value._id);
    commentiProposta.value = data.commenti || [];
  } catch (err: any) {
    console.error("Errore nel caricamento commenti:", err);
    commentiProposta.value = [];
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
    await addCommento(
      propostaSelezionata.value._id,
      commentoTemp,
      userStore.token
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
    const updatedProposta = await toggleHyperProposta(
      propostaSelezionata.value._id,
      userStore.token
    );
    
    // Aggiorna la proposta selezionata
    propostaSelezionata.value = updatedProposta;
    
    // Aggiorna anche la proposta nella lista principale
    const index = proposte.value.findIndex(p => p._id === propostaSelezionata.value!._id);
    if (index !== -1) {
      proposte.value[index] = updatedProposta;
    }
    
    // Aggiorna anche la proposta nei risultati di ricerca se presenti
    if (searchExecuted.value && searchResults.value.length > 0) {
      const searchIndex = searchResults.value.findIndex(p => p._id === propostaSelezionata.value!._id);
      if (searchIndex !== -1) {
        searchResults.value[searchIndex] = updatedProposta;
      }
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

// Funzioni per la ricerca
let searchTimeout: number

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const clearSearch = () => {
  searchQuery.value = ''
  searchExecuted.value = false
  searchResults.value = []
}

const onSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    executeSearch()
  }, 300)
}

const executeSearch = async () => {
  if (!searchQuery.value && !hasActiveFilters.value) {
    searchExecuted.value = false
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    const filters: SearchFilters = {
      ...searchFilters.value,
      q: searchQuery.value || undefined
    }

    const response = await searchProposte(filters)
    searchResults.value = response.proposte
    searchExecuted.value = true
    
  } catch (error) {
    console.error('Errore nella ricerca:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    const data = await getAllProposte()
    proposte.value = data
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

    <!-- Barra di ricerca -->
    <div class="search-container">
      <div class="search-bar">
        <div class="search-input-container">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cerca proposte per titolo o descrizione..."
            class="search-input"
            @input="onSearch"
          />
          <button 
            v-if="searchQuery" 
            @click="clearSearch" 
            class="clear-btn"
            title="Cancella ricerca"
          >
            ✕
          </button>
        </div>
        
        <button 
          @click="toggleFilters" 
          class="filters-btn"
          :class="{ active: showFilters }"
        >
          <span class="filter-icon">🔍</span>
          Filtri
        </button>
      </div>

      <!-- Pannello filtri avanzati -->
      <Transition name="slide-down">
        <div v-if="showFilters" class="filters-panel">
          <div class="filters-grid">
            <!-- Filtro categoria -->
            <div class="filter-group">
              <label class="filter-label">Categoria</label>
              <select v-model="searchFilters.categoria" @change="onSearch" class="filter-select">
                <option value="">Tutte le categorie</option>
                <option value="cultura">🎭 Cultura</option>
                <option value="concerti">🎵 Concerti</option>
                <option value="mostreInstallazioni">🖼️ Mostre e installazioni</option>
                <option value="sport">⚽ Sport</option>
                <option value="workshopCorsi">📚 Workshop e corsi</option>
                <option value="conferenze">🎤 Conferenze</option>
              </select>
            </div>

            <!-- Filtro città -->
            <div class="filter-group">
              <label class="filter-label">Città</label>
              <input 
                v-model="searchFilters.citta" 
                @input="onSearch"
                type="text" 
                placeholder="Es: Milano, Roma..." 
                class="filter-input"
              />
            </div>

            <!-- Filtro stato -->
            <div class="filter-group">
              <label class="filter-label">Stato</label>
              <select v-model="searchFilters.stato" @change="onSearch" class="filter-select">
                <option value="">Tutti gli stati</option>
                <option value="proposta">📝 Proposta</option>
                <option value="approvata">✅ Approvata</option>
                <option value="respinta">❌ Respinta</option>
                <option value="in_corso">🔄 In corso</option>
                <option value="completata">✅ Completata</option>
              </select>
            </div>

            <!-- Ordinamento -->
            <div class="filter-group">
              <label class="filter-label">Ordina per</label>
              <select v-model="searchFilters.sortBy" @change="onSearch" class="filter-select">
                <option value="createdAt">Data creazione</option>
                <option value="hyperCount">Numero di hyper</option>
                <option value="titolo">Titolo</option>
              </select>
            </div>
          </div>

          <div class="filters-actions">
            <button @click="showFilters = false" class="close-filters-btn">
              Chiudi filtri
            </button>
          </div>
        </div>
      </Transition>

      <!-- Indicatori filtri attivi -->
      <div v-if="hasActiveFilters" class="active-filters">
        <span class="active-filters-label">Filtri attivi:</span>
        <div class="filter-tags">
          <span v-if="searchQuery" class="filter-tag">
            Ricerca: "{{ searchQuery }}"
            <button @click="searchQuery = ''; onSearch()" class="tag-remove">✕</button>
          </span>
          <span v-if="searchFilters.categoria" class="filter-tag">
            Categoria: {{ getCategoryLabel(searchFilters.categoria) }}
            <button @click="searchFilters.categoria = ''; onSearch()" class="tag-remove">✕</button>
          </span>
          <span v-if="searchFilters.citta" class="filter-tag">
            Città: {{ searchFilters.citta }}
            <button @click="searchFilters.citta = ''; onSearch()" class="tag-remove">✕</button>
          </span>
          <span v-if="searchFilters.stato" class="filter-tag">
            Stato: {{ searchFilters.stato }}
            <button @click="searchFilters.stato = ''; onSearch()" class="tag-remove">✕</button>
          </span>
        </div>
      </div>
    </div>

    <div class="toggle-container">
      <div class="toggle-switch">
        <div class="toggle-slider" :class="{ 'slide-right': selected === 'classifica' }"></div>
        <button
          class="toggle-option"
          :class="{ active: selected === 'esplora' }"
          @click="selected = 'esplora'"
        >
          Esplora
        </button>
        <button
          class="toggle-option"
          :class="{ active: selected === 'classifica' }"
          @click="selected = 'classifica'"
        >
          Classifica
        </button>
      </div>
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
        <!-- <div class="categorie-section">
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
        </div> -->

        <!--sezione nuove proposte--> 
        <div class="proposte-section">
          <div class="section-header">
            <h2 class="section-title">✨ Nuove Proposte</h2>
            <p class="section-subtitle">Scopri le ultime idee della community</p>
          </div>
          
          <div v-if="isLoading || isSearching" class="loading-container">
            <div class="loading-spinner"></div>
            <p>{{ isSearching ? 'Ricerca in corso...' : 'Caricamento proposte...' }}</p>
          </div>
          
          <div v-else-if="proposteVisualizzate.length === 0" class="empty-proposte">
            <div class="empty-icon">{{ searchExecuted ? '�' : '�📝' }}</div>
            <h3>{{ searchExecuted ? 'Nessun risultato trovato' : 'Nessuna proposta ancora' }}</h3>
            <p>{{ searchExecuted ? 'Prova a modificare i criteri di ricerca' : 'Sii il primo a condividere un\'idea con la community!' }}</p>
            <RouterLink v-if="userStore.user && !searchExecuted" to="/addProposta" class="cta-button">
              ➕ Aggiungi la tua proposta
            </RouterLink>
            <button v-if="searchExecuted" @click="clearSearch" class="cta-button">
              🔄 Mostra tutte le proposte
            </button>
          </div>
          
          <div v-else>
            <div class="proposte-grid" :class="{ 'with-panel': propostaSelezionata }">
              <div
                v-for="proposta in proposteVisualizzate"
                :key="proposta.titolo"
                class="proposta-card"
                @click="apriDettaglio(proposta)"
              >
                <div class="proposta-image-container">
                  <img
                    v-if="proposta.foto"
                    :src="processImageUrl(proposta.foto)"
                    alt="Immagine proposta"
                    class="proposta-img"
                  />
                  <div v-else class="proposta-img-placeholder">
                    <span class="placeholder-icon">📸</span>
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
                  <h3 class="proposta-title">{{ proposta.titolo }}</h3>
                  <p class="proposta-description">
                    {{ proposta.descrizione.substring(0, 80) }}{{ proposta.descrizione.length > 80 ? '...' : '' }}
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

                <button @click.stop="$router.push(`/proposte/${proposta._id}`)" class="open-in-new-page-btn">
                  Apri in nuova pagina
                </button>
              </div>
            </div>
          </div>
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

/* Toggle Container */
.toggle-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.toggle-switch {
  position: relative;
  display: flex;
  background: #e6e6e6;
  border-radius: 2rem;
  padding: 0.25rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-slider {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: calc(50% - 0.25rem);
  height: calc(100% - 0.5rem);
  background: #fe4654;
  border-radius: 1.75rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

.toggle-slider.slide-right {
  transform: translateX(100%);
}

.toggle-option {
  position: relative;
  z-index: 2;
  padding: 0.5rem 2rem;
  border: none;
  background: transparent;
  color: #404149;
  font-size: 1.1rem;
  border-radius: 1.75rem;
  cursor: pointer;
  transition: color 0.3s ease;
  min-width: 120px;
  text-align: center;
}

.toggle-option.active {
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
.proposte-section {
  margin-top: 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem 1.5rem;
  background: linear-gradient(135deg, #fe4654 0%, #404149 100%);
  border-radius: 1.5rem;
  margin: 0 1.5rem 2rem 1.5rem;
  box-shadow: 0 4px 20px rgba(254, 70, 84, 0.3);
}

.section-title {
  color: #fff;
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.section-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
}

.empty-proposte {
  text-align: center;
  padding: 4rem 2rem;
  background: #fff;
  border-radius: 1.5rem;
  margin: 0 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.empty-proposte .empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-proposte h3 {
  color: #404149;
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.empty-proposte p {
  color: #666;
  font-size: 1rem;
  margin: 0 0 2rem 0;
  line-height: 1.5;
}

.cta-button {
  display: inline-block;
  background: linear-gradient(135deg, #fe4654, #e63946);
  color: #fff;
  text-decoration: none;
  padding: 1rem 2rem;
  border-radius: 2rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(254, 70, 84, 0.3);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(254, 70, 84, 0.4);
  background: linear-gradient(135deg, #e63946, #dc3545);
}

.proposte-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  padding: 0 1.5rem;
  margin-top: 1.5rem;
}

.proposta-card {
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(0,0,0,0.05);
}

.proposta-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 35px rgba(0,0,0,0.15);
  border-color: rgba(254, 70, 84, 0.2);
}

.proposta-image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.proposta-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.proposta-card:hover .proposta-img {
  transform: scale(1.05);
}

.open-in-new-page-btn {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.proposta-card:hover .open-in-new-page-btn {
  opacity: 1;
}

.proposta-img-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.placeholder-icon {
  font-size: 3rem;
  color: #adb5bd;
  opacity: 0.7;
}

.categoria-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(255, 255, 255, 0.95);
  color: #404149;
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.hyper-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(254, 70, 84, 0.95);
  color: #fff;
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(254, 70, 84, 0.3);
}

.hyper-badge .hyper-icon {
  font-size: 1.5rem;
}

.proposta-content {
  padding: 1.5rem;
}

.proposta-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #404149;
  margin: 0 0 0.8rem 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.proposta-description {
  color: #6c757d;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.proposta-footer {
  border-top: 1px solid #f1f3f4;
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
  color: #6c757d;
  font-size: 0.85rem;
  font-weight: 500;
}

.meta-icon {
  font-size: 0.9rem;
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
  color: #2B2C34;
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

/* Search styles */
.search-container {
  margin-bottom: 2rem;
  background: #2B2C34;
  border-radius: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  padding: 1.5rem;
  border: 1px solid rgba(0,0,0,0.05);
}

.search-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-input-container {
  flex: 1;
  position: relative;
  min-width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e6e6e6;
  border-radius: 2rem;
  font-size: 1rem;
  background: #404149;
  transition: all 0.3s ease;
  color: #404149;
}

.search-input:focus {
  outline: none;
  border-color: #fe4654;
  box-shadow: 0 0 0 3px rgba(254, 70, 84, 0.1);
}

.search-input::placeholder {
  color: #999;
}

.clear-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: #404149;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: #fe4654;
  transform: translateY(-50%) scale(1.1);
}

.filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #e6e6e6;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #404149;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.filters-btn:hover {
  background: #d6d6d6;
  transform: translateY(-2px);
}

.filters-btn.active {
  background: #fe4654;
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(254, 70, 84, 0.3);
}

.filter-icon {
  font-size: 1.2rem;
}

.filters-panel {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 1rem;
  border: 1px solid rgba(0,0,0,0.05);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 600;
  color: #404149;
  font-size: 0.9rem;
}

.filter-select,
.filter-input {
  padding: 0.6rem 1rem;
  border: 2px solid #e6e6e6;
  border-radius: 0.8rem;
  background: white;
  font-size: 0.9rem;
  color: #404149;
  transition: all 0.3s ease;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #fe4654;
  box-shadow: 0 0 0 3px rgba(254, 70, 84, 0.1);
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e6e6e6;
}

.close-filters-btn {
  padding: 0.6rem 1.5rem;
  background: #404149;
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.close-filters-btn:hover {
  background: #fe4654;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(254, 70, 84, 0.3);
}

.active-filters {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e6e6e6;
}

.active-filters-label {
  font-weight: 600;
  color: #404149;
  margin-right: 0.5rem;
  font-size: 0.9rem;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #fe4654, #e63946);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

.tag-remove {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.2rem 0.4rem;
  border-radius: 50%;
  opacity: 0.8;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.tag-remove:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input-container {
    min-width: auto;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
