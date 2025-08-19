<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { IProposta } from "../types/Proposta"
import type { IUser } from "../types/User"
import { useUserStore } from '@/stores/userStore'
import { useFollowStore } from '@/stores/followStore'
import { 
  searchProposte, 
  type SearchFilters, 
  getAllProposte,
  getFollowedUsersProposte
} from '@/api/propostaApi'
import { searchUsers, type SearchUsersResponse } from '@/api/userApi'

// Router per navigazione
const router = useRouter()
const followStore = useFollowStore()

// Stato di caricamento
const isLoading = ref(false)

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
const selected = ref<'classifica' | 'esplora' | 'seguiti'>('esplora')
const userStore = useUserStore()

// Stato per la ricerca
const searchQuery = ref('')
const searchType = ref<'proposte' | 'utenti'>('proposte') // Toggle per tipo ricerca
const showFilters = ref(false)
const isSearching = ref(false)
const searchResults = ref<IProposta[]>([])
const searchUsersResults = ref<IUser[]>([])
const searchExecuted = ref(false)

// Filtro per tipo utente (solo per ricerca utenti)
const userTypeFilter = ref<'all' | 'privato' | 'ente'>('all')

const searchFilters = ref<SearchFilters>({
  categoria: '',
  citta: '',
  stato: '',
  sortBy: 'createdAt',
  sortOrder: 'desc'
})

// Stato per controllare la visibilità del banner
const showBanner = ref(true)

// Stato per le proposte dei seguiti
const seguitiProposte = ref<IProposta[]>([])
const loadingSeguiti = ref(false)

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
  
  if (selected.value === 'seguiti') {
    return seguitiProposte.value
  }
  
  return proposteFiltrate.value
})

// Computed per verificare se ci sono filtri attivi
const hasActiveFilters = computed(() => {
  return searchQuery.value || 
         (searchType.value === 'proposte' && (searchFilters.value.categoria || searchFilters.value.citta)) ||
         (searchType.value === 'utenti' && userTypeFilter.value !== 'all')
})

// CLASSIFICA - proposte ordinate per numero di hyper
const classificaProposte = computed(() => {
  return [...proposte.value]
    .sort((a, b) => (b.listaHyper?.length || 0) - (a.listaHyper?.length || 0))
    .slice(0, 10) // Top 10
})

// Controlli per tipo utente (ora utilizzano i getter dello store)
// const isOperatore = computed(() => userStore.isOperatore)
// const isAmministratore = computed(() => userStore.isAdmin) // Admin non gestisce moderazione
// const canHype = computed(() => userStore.canHype)

// LOGICA PER I COMMENTI - RIMOSSA

// PROPOSTA DA APRIRE SULLA DESTRA - RIMOSSA

// LOGICA PER IL BOTTONE HYPE - RIMOSSA

// Funzioni per commenti (non utilizzate attualmente)
// function getUserBadge(commento: any) {
//   return ''; // Nessun badge per tutti gli utenti
// }

// function getUserName(commento: any) {
//   if (!commento.utente) return 'Utente';
//   return `${commento.utente.cognome || ''} ${commento.utente.cognome || ''}`.trim() || 'Utente';
// }

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
  userTypeFilter.value = 'all'
  searchExecuted.value = false
  searchResults.value = []
  searchUsersResults.value = []
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
    searchUsersResults.value = []
    return
  }

  isSearching.value = true
  try {
    if (searchType.value === 'proposte') {
      const filters: SearchFilters = {
        ...searchFilters.value,
        q: searchQuery.value || undefined
      }

      const response = await searchProposte(filters)
      searchResults.value = response.proposte
      searchUsersResults.value = []
    } else {
      // Ricerca utenti
      if (searchQuery.value) {
        const response: SearchUsersResponse = await searchUsers(searchQuery.value)
        let filteredUsers = response.data.users
        
        // Applica il filtro per tipo utente
        if (userTypeFilter.value !== 'all') {
          filteredUsers = filteredUsers.filter(user => user.userType === userTypeFilter.value)
        }
        
        searchUsersResults.value = filteredUsers
        searchResults.value = []

        // Carica gli status di follow per tutti gli utenti trovati se l'utente è loggato e non è operatore/admin
        if (userStore.user && !userStore.isOperatore) {
          const followPromises = filteredUsers
            .filter(user => user._id !== userStore.user?._id)
            .map(user => followStore.loadFollowStatus(user._id))
          
          await Promise.all(followPromises)
        }
      }
    }
    searchExecuted.value = true
    
  } catch (error) {
    console.error('Errore nella ricerca:', error)
    searchResults.value = []
    searchUsersResults.value = []
  } finally {
    isSearching.value = false
  }
}

// Funzione per cambiare il tipo di ricerca
const onSearchTypeChange = () => {
  clearSearch()
  // Resetta anche i filtri specifici
  if (searchType.value === 'utenti') {
    userTypeFilter.value = 'all'
  }
  // Se c'è già una query, riesegui la ricerca con il nuovo tipo
  if (searchQuery.value) {
    executeSearch()
  }
}

// Funzione per navigare al profilo utente
const goToUserProfile = (userId: string) => {
  router.push(`/users/${userId}`)
}

// Funzione per gestire il follow/unfollow nelle card
const toggleFollowInCard = async (userId: string, event: Event) => {
  // Previeni la navigazione al profilo quando si clicca sul bottone
  event.stopPropagation()
  
  if (!userStore.user) {
    // Se non è loggato, reindirizza al login
    router.push('/login')
    return
  }
  
  // Controlla se l'utente è operatore
  if (userStore.isOperatore) {
    
    return
  }
  
  try {
    if (followStore.isFollowing(userId)) {
      await followStore.unfollowUser(userId)
    } else {
      await followStore.followUser(userId)
    }
  } catch (error) {
    console.error('Errore nel follow/unfollow:', error)
  }
}

// Computed per verificare se l'utente può seguire (è loggato, non è se stesso, e non è operatore)
const canFollowUser = (userId: string) => {
  return userStore.user && 
         userStore.user._id !== userId && 
         !userStore.isOperatore
}

// Funzione per gestire l'immagine del profilo utente
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

// Funzione per caricare le proposte degli utenti seguiti
const loadSeguiti = async () => {
  if (!userStore.user || !userStore.token) {
    seguitiProposte.value = []
    return
  }

  // Operatori non possono avere seguiti
  if (userStore.isOperatore) {
    seguitiProposte.value = []
    return
  }

  loadingSeguiti.value = true
  try {
    const data = await getFollowedUsersProposte(userStore.token)
    seguitiProposte.value = data
  } catch (error) {
    console.error('Errore nel caricamento proposte seguiti:', error)
    seguitiProposte.value = []
  } finally {
    loadingSeguiti.value = false
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

// Watcher per caricare le proposte dei seguiti quando viene selezionata la tab
watch(selected, (newValue) => {
  if (newValue === 'seguiti') {
    loadSeguiti()
  }
})

// Watcher per caricare i seguiti quando l'utente si logga
watch(() => userStore.user, (newUser) => {
  if (newUser && selected.value === 'seguiti') {
    loadSeguiti()
  }
})

// Watcher per reindirizzare operatori/admin da "seguiti" a "esplora"
watch([() => userStore.isOperatore, () => selected.value], ([isOp, selectedValue]) => {
  if (isOp && selectedValue === 'seguiti') {
    selected.value = 'esplora'
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
      <!-- Titolo della sezione ricerca -->
      <div class="search-header">
        <h2 class="search-title">
          Cerca
        </h2>
        <p class="search-subtitle">Trova proposte e utenti nella community</p>
      </div>

      <div class="search-bar">
        <div class="search-input-container">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchType === 'proposte' 
              ? 'Cerca proposte per titolo o descrizione...' 
              : 'Cerca utenti per nome, cognome o email...'"
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
        
        <!-- Toggle tipo ricerca spostato accanto alla barra -->
        <div class="search-type-toggle" :data-active-type="searchType === 'proposte' ? 'Cerca Proposte' : 'Cerca Utenti'">
          <div class="toggle-wrapper">
            <div class="toggle-slider" :class="{ 'slide-right': searchType === 'utenti' }"></div>
            <button
              @click="searchType = 'proposte'; onSearchTypeChange()"
              :class="['search-type-btn', { active: searchType === 'proposte' }]"
            >
              <span class="btn-text">Proposte</span>
            </button>
            <button
              @click="searchType = 'utenti'; onSearchTypeChange()"
              :class="['search-type-btn', { active: searchType === 'utenti' }]"
            >
              <span class="btn-text">Utenti</span>
            </button>
          </div>
        </div>
        
        <!-- Container fisso per controlli aggiuntivi -->
        <div class="search-controls">
          <button 
            @click="toggleFilters" 
            class="filters-btn"
            :class="{ active: showFilters }"
          >
            Filtri
          </button>
        </div>
      </div>

      <!-- Pannello filtri avanzati -->
      <Transition name="slide-down">
        <div v-if="showFilters" class="filters-panel">
          <!-- Filtri per proposte -->
          <div v-if="searchType === 'proposte'" class="filters-grid">
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
          </div>

          <!-- Filtri per utenti -->
          <div v-if="searchType === 'utenti'" class="filters-grid">
            <!-- Filtro tipo utente -->
            <div class="filter-group">
              <label class="filter-label">Tipo Utente</label>
              <select v-model="userTypeFilter" @change="onSearch" class="filter-select">
                <option value="all">Tutti</option>
                <option value="user">👤 Utenti Privati</option>
                <option value="ente">🏢 Enti</option>
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
            {{ searchType === 'proposte' ? 'Ricerca proposte' : 'Ricerca utenti' }}: "{{ searchQuery }}"
            <button @click="searchQuery = ''; onSearch()" class="tag-remove">✕</button>
          </span>
          <span v-if="searchType === 'proposte' && searchFilters.categoria" class="filter-tag">
            Categoria: {{ getCategoryLabel(searchFilters.categoria) }}
            <button @click="searchFilters.categoria = ''; onSearch()" class="tag-remove">✕</button>
          </span>
          <span v-if="searchType === 'proposte' && searchFilters.citta" class="filter-tag">
            Città: {{ searchFilters.citta }}
            <button @click="searchFilters.citta = ''; onSearch()" class="tag-remove">✕</button>
          </span>
          <span v-if="searchType === 'utenti' && userTypeFilter !== 'all'" class="filter-tag">
            Tipo: {{ userTypeFilter === 'privato' ? '👤 Utenti Privati' : '🏢 Enti' }}
            <button @click="userTypeFilter = 'all'; onSearch()" class="tag-remove">✕</button>
          </span>
        </div>
      </div>
    </div>

    <div class="main-toggle-container">
      <div class="main-toggle-switch">
        <div class="main-toggle-background">
          <div class="main-toggle-slider" :class="{ 
                    'slide-center': selected === 'seguiti' && !userStore.isOperatore,
        'slide-right': selected === 'classifica' && !userStore.isOperatore,
        'slide-right-two': selected === 'classifica' && userStore.isOperatore,
        'slide-left-two': selected === 'esplora' && userStore.isOperatore
          }"></div>
        </div>
        <button
          class="main-toggle-option"
          :class="{ active: selected === 'esplora' }"
          @click="selected = 'esplora'"
        >
          <span class="toggle-text">Esplora</span>
        </button>
        <button
                          v-if="!userStore.isOperatore"
          class="main-toggle-option"
          :class="{ active: selected === 'seguiti' }"
          @click="selected = 'seguiti'"
        >
          <span class="toggle-text">Seguiti</span>
        </button>
        <button
          class="main-toggle-option"
          :class="{ active: selected === 'classifica' }"
          @click="selected = 'classifica'"
        >
          <span class="toggle-text">Classifica</span>
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
              @click="$router.push(`/proposte/${proposta._id}`)"
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

      <div v-else-if="selected === 'seguiti'">
        <!--SEZIONE SEGUITI-->
        <div class="seguiti-section">
          <div class="section-header">
            <h2 class="section-title">👥 Proposte dei tuoi Seguiti</h2>
            <p class="section-subtitle">
              {{ !userStore.user ? 'Accedi per vedere le proposte dei tuoi seguiti' :
                 loadingSeguiti ? 'Caricamento...' :
                 seguitiProposte.length > 0 ? `${seguitiProposte.length} proposte dai tuoi seguiti` : 
                 'Nessuna proposta dai tuoi seguiti' }}
            </p>
          </div>
          
          <div v-if="!userStore.user" class="empty-state">
            <div class="empty-icon">👤</div>
            <h3>Per visualizzare i contenuti dei seguiti devi effettuare il login</h3>
            <p>Accedi o registrati per seguire altri utenti e vedere le loro proposte qui</p>
            <div class="auth-buttons">
              <button @click="$router.push('/login')" class="cta-button primary">
                Accedi
              </button>
              <button @click="$router.push('/addUser')" class="cta-button secondary">
                Registrati
              </button>
            </div>
          </div>
          
          <div v-else-if="userStore.isOperatore" class="empty-state">
            <div class="empty-icon">👮‍♀️</div>
                          <h3>Funzione non disponibile per operatori</h3>
                          <p>Gli operatori non possono seguire altri utenti</p>
            <button @click="selected = 'esplora'" class="cta-button">
              Torna a Esplora
            </button>
          </div>
          
          <div v-else-if="loadingSeguiti" class="loading-container">
            <div class="loading-spinner"></div>
            <p>Caricamento proposte dei seguiti...</p>
          </div>
          
          <div v-else-if="seguitiProposte.length === 0" class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>Nessuna proposta dai tuoi seguiti</h3>
            <p>Inizia a seguire altri utenti per vedere le loro proposte qui</p>
            <button @click="selected = 'esplora'" class="cta-button">
              Scopri utenti da seguire
            </button>
          </div>
          
          <div v-else class="proposte-grid">
            <div 
              v-for="proposta in seguitiProposte" 
              :key="proposta._id"
              class="proposta-card"
              @click="$router.push(`/proposte/${proposta._id}`)"
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
                  </div>
                </div>
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

        <!--sezione risultati ricerca o proposte--> 
        <div class="risultati-section">
          <!-- Sezione proposte -->
          <div v-if="searchType === 'proposte'" class="proposte-section">
            <div class="section-header">
              <h2 class="section-title">
                {{ searchExecuted ? '🔍 Risultati ricerca proposte' : '✨ Nuove Proposte' }}
              </h2>
              <p class="section-subtitle">
                {{ searchExecuted ? 
                  (searchResults.length > 0 ? `Trovate ${searchResults.length} proposte` : 'Nessuna proposta trovata') :
                  'Scopri le ultime idee della community' 
                }}
              </p>
            </div>
            
            <div v-if="isLoading || isSearching" class="loading-container">
              <div class="loading-spinner"></div>
              <p>{{ isSearching ? 'Ricerca in corso...' : 'Caricamento proposte...' }}</p>
            </div>
            
            <div v-else-if="proposteVisualizzate.length === 0" class="empty-proposte">
              <div class="empty-icon">{{ searchExecuted ? '🔍' : '📝' }}</div>
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
              <div class="proposte-grid">
                <div
                  v-for="proposta in proposteVisualizzate"
                  :key="proposta.titolo"
                  class="proposta-card"
                  @click="$router.push(`/proposte/${proposta._id}`)"
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sezione utenti -->
          <div v-else-if="searchType === 'utenti'" class="utenti-section">
            <div class="section-header">
              <h2 class="section-title">👥 Ricerca Utenti</h2>
              <p class="section-subtitle">
                {{ searchExecuted ? 
                  (searchUsersResults.length > 0 ? `Trovati ${searchUsersResults.length} utenti` : 'Nessun utente trovato') :
                  'Cerca utenti nella community' 
                }}
              </p>
            </div>
            
            <div v-if="isSearching" class="loading-container">
              <div class="loading-spinner"></div>
              <p>Ricerca utenti in corso...</p>
            </div>

            <div v-else-if="!searchExecuted" class="empty-utenti">
              <div class="empty-icon">👥</div>
              <h3>Inizia a cercare</h3>
              <p>Inserisci nome, cognome o email per trovare utenti nella community</p>
            </div>
            
            <div v-else-if="searchUsersResults.length === 0" class="empty-utenti">
              <div class="empty-icon">🔍</div>
              <h3>Nessun utente trovato</h3>
              <p>Prova con un altro termine di ricerca</p>
              <button @click="clearSearch" class="cta-button">
                🔄 Cancella ricerca
              </button>
            </div>
            
            <div v-else>
              <div class="utenti-grid">
                <div
                  v-for="utente in searchUsersResults"
                  :key="utente._id"
                  class="utente-card"
                  @click="goToUserProfile(utente._id)"
                >
                  <div class="utente-image-container">
                    <img
                      v-if="utente.fotoProfilo"
                      :src="processUserProfileImage(utente.fotoProfilo)"
                      alt="Foto profilo"
                      class="utente-img"
                    />
                    <div v-else class="utente-img-placeholder">
                      <span class="placeholder-icon">👤</span>
                    </div>
                  </div>
                  
                  <div class="utente-content">
                    <h3 class="utente-nome">
                      {{ `${utente.nome || ''} ${utente.cognome || ''}`.trim() || 'Utente' }}
                    </h3>
                    <p v-if="utente.credenziali?.email" class="utente-email">{{ utente.credenziali.email }}</p>
                    <p v-if="utente.biografia" class="utente-bio">{{ utente.biografia.substring(0, 100) }}{{ utente.biografia.length > 100 ? '...' : '' }}</p>

                    <!-- Bottone Follow nella card -->
                    <div v-if="canFollowUser(utente._id)" class="card-follow-section">
                      <button 
                        @click="toggleFollowInCard(utente._id, $event)"
                        :class="['card-follow-btn', { 
                          'following': followStore.isFollowing(utente._id)
                        }]"
                      >
                        {{ followStore.isFollowing(utente._id) ? '✓ Seguito' : '+ Segui' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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

.loading-container p {
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

/* Main Toggle Container - Design Compatto */
.main-toggle-container {
  margin: 1.5rem auto 2rem auto;
  max-width: 500px;
  text-align: center;
}

.main-toggle-header {
  margin-bottom: 1.2rem;
}

.main-toggle-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-icon {
  font-size: 1.6rem;
  filter: drop-shadow(0 1px 2px rgba(254, 70, 84, 0.3));
}

.main-toggle-subtitle {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin: 0;
  font-weight: 500;
  opacity: 0.8;
}

.main-toggle-switch {
  position: relative;
  display: flex;
  background: var(--color-card-background);
  border-radius: 3rem;
  padding: 0.2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.main-toggle-background {
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  right: 0.2rem;
  bottom: 0.2rem;
  border-radius: 2.8rem;
  overflow: hidden;
  pointer-events: none;
}

.main-toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  width: 33.333%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: 2.8rem;
  transition: all 0.3s ease;
  transform: translateX(0);
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

/* Slider per layout con 2 bottoni quando l'utente è operatore/admin */
.main-toggle-switch:has(button:nth-child(2):last-child) .main-toggle-slider {
  width: 50%;
}

.main-toggle-slider.slide-center {
  transform: translateX(100%);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

.main-toggle-slider.slide-right {
  transform: translateX(200%);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

/* Slider per layout con 2 bottoni (operatori/admin) */
.main-toggle-slider.slide-right-two {
  width: 50%;
  transform: translateX(100%);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

/* Slider per layout con 2 bottoni - posizione sinistra per Esplora (operatori/admin) */
.main-toggle-slider.slide-left-two {
  width: 50%;
  transform: translateX(0);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

.main-toggle-option {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  padding: 0.8rem 2rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 2.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  text-align: center;
}

.toggle-text {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: all 0.3s ease;
}

.toggle-description {
  font-size: 0.7rem;
  font-weight: 500;
  opacity: 0.7;
  transition: all 0.3s ease;
}

.main-toggle-option.active {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.main-toggle-option.active .toggle-text {
  font-weight: 700;
}

.main-toggle-option.active .toggle-description {
  opacity: 0.9;
  font-weight: 600;
}

.main-toggle-option:not(.active):hover {
  color: var(--color-text);
}

.main-toggle-option:not(.active):hover .toggle-text {
  font-weight: 700;
}

/* Responsive per toggle principale */
@media (max-width: 768px) {
  .main-toggle-container {
    max-width: 350px;
  }
  
  .main-toggle-title {
    font-size: 1.5rem;
  }
  
  .title-icon {
    font-size: 1.4rem;
  }
  
  .main-toggle-subtitle {
    font-size: 0.8rem;
  }
  
  .main-toggle-option {
    padding: 0.4rem 1.2rem;
  }
  
  .toggle-text {
    font-size: 0.75rem;
  }
  
  .toggle-description {
    font-size: 0.65rem;
  }
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
  background: var(--color-card-background);
  border-radius: 1.2rem;
  margin: 1.5rem;
  box-shadow: 0 2px 16px var(--color-shadow);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-state h3 {
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--color-text-secondary);
  margin: 0;
}

.classifica-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1.5rem;
}

.classifica-item {
  background: var(--color-card-background);
  border-radius: 1.2rem;
  padding: 1.5rem;
  box-shadow: 0 2px 16px var(--color-shadow);
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
  color: var(--color-text);
  background: var(--color-background-mute);
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
  background: var(--color-background-mute);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--color-text-secondary);
}

.classifica-info {
  flex: 1;
}

.classifica-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-heading);
  margin: 0 0 0.3rem 0;
}

.classifica-categoria {
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.classifica-description {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.classifica-hyper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.8rem;
  background: var(--color-primary);
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
  background: var(--color-card-background);
  border-radius: 1.5rem;
  margin: 0 1.5rem;
  box-shadow: 0 4px 20px var(--color-shadow);
}

.empty-proposte .empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-proposte h3 {
  color: var(--color-heading);
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.empty-proposte p {
  color: var(--color-text-secondary);
  font-size: 1rem;
  margin: 0 0 2rem 0;
  line-height: 1.5;
}

.cta-button {
  display: inline-block;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: #fff;
  text-decoration: none;
  padding: 1rem 2rem;
  border-radius: 2rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px var(--color-primary-light);
  border: none;
  cursor: pointer;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px var(--color-primary-light);
  background: linear-gradient(135deg, var(--color-primary-hover), var(--color-primary));
}

.auth-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-button.primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
}

.cta-button.secondary {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3);
}

.cta-button.secondary:hover {
  background: linear-gradient(135deg, #4b5563, #374151);
  box-shadow: 0 6px 25px rgba(107, 114, 128, 0.4);
}

.proposte-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  padding: 0 1.5rem;
  margin-top: 1.5rem;
}

.proposta-card {
  background: var(--color-card-background);
  border-radius: 1.5rem;
  box-shadow: 0 4px 20px var(--color-shadow);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid var(--color-border);
}

.proposta-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 35px var(--color-shadow);
  border-color: var(--color-primary-light);
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

.proposta-img-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-background-soft), var(--color-background-mute));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.placeholder-icon {
  font-size: 3rem;
  color: var(--color-text-secondary);
  opacity: 0.7;
}

.categoria-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: var(--color-card-background);
  color: var(--color-text);
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px var(--color-shadow);
  border: 1px solid var(--color-border);
}

.hyper-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--color-card-background);
  color: var(--color-primary);
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px var(--color-shadow);
  border: 1px solid var(--color-border);
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
  color: var(--color-heading);
  margin: 0 0 0.8rem 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.proposta-description {
  color: var(--color-text-secondary);
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
  font-size: 0.85rem;
  font-weight: 500;
}

.meta-icon {
  font-size: 0.9rem;
}

/* Stili per le card utenti */
.utenti-section {
  margin: 2rem 0;
}

.utenti-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 0 1.5rem;
}

.utente-card {
  background: var(--color-card-background);
  border-radius: 1.2rem;
  padding: 1.5rem;
  box-shadow: 0 2px 16px var(--color-shadow);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.utente-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px var(--color-shadow-hover);
  border-color: var(--color-primary);
}

.utente-image-container {
  position: relative;
  margin-bottom: 1rem;
}

.utente-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--color-border);
  transition: all 0.3s ease;
}

.utente-card:hover .utente-img {
  border-color: var(--color-primary);
  transform: scale(1.05);
}

.utente-img-placeholder {
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

.utente-card:hover .utente-img-placeholder {
  border-color: var(--color-primary);
  transform: scale(1.05);
}

.utente-content {
  width: 100%;
}

.utente-nome {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.utente-email {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
  word-break: break-all;
}

.utente-bio {
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

.utente-stats {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
}

.stat-icon {
  font-size: 0.9rem;
}

.empty-utenti {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--color-card-background);
  border-radius: 1.2rem;
  margin: 1.5rem;
  box-shadow: 0 2px 16px var(--color-shadow);
}

.empty-utenti .empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-utenti h3 {
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}

.empty-utenti p {
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.card-follow-section {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.card-follow-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 1.5rem;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 90px;
}

.card-follow-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 10px var(--color-primary-light);
}

.card-follow-btn.following {
  background: #22c55e;
}

.card-follow-btn.following:hover {
  background: #dc2626;
}

/* Search styles */
.search-container {
  margin-bottom: 1.5rem;
  background: var(--color-card-background);
  border-radius: 1rem;
  box-shadow: 0 2px 12px var(--color-shadow);
  padding: 1.2rem;
  border: 1px solid var(--color-border);
}

/* Titolo della sezione ricerca */
.search-header {
  text-align: center;
  margin-bottom: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid var(--color-border);
}

.search-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.3rem 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.search-subtitle {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  margin: 0;
  font-weight: 500;
}

/* Search type toggle - Design migliorato */
.search-type-toggle {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.toggle-wrapper {
  position: relative;
  display: flex;
  background: var(--color-background-soft, rgba(0, 0, 0, 0.05));
  border-radius: 1.5rem;
  padding: 0.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--color-border, rgba(0, 0, 0, 0.1));
}

.toggle-slider {
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  width: calc(50% - 0.2rem);
  height: calc(100% - 0.4rem);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: 1.3rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(254, 70, 84, 0.3);
  transform: translateX(0);
}

.toggle-slider.slide-right {
  transform: translateX(100%);
}

.search-type-btn {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.5rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 1.3rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
  text-align: center;
}

.search-type-btn .btn-text {
  font-weight: 600;
  transition: all 0.3s ease;
  letter-spacing: 0.01em;
}

.search-type-btn.active {
  color: white;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.search-type-btn.active .btn-icon {
  transform: scale(1.1);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.search-type-btn.active .btn-text {
  letter-spacing: 0.05em;
}

.search-type-btn:not(.active):hover {
  color: var(--color-primary, #fe4654);
  background: rgba(254, 70, 84, 0.1);
  transform: translateY(-1px);
}

.search-type-btn:not(.active):hover .btn-icon {
  transform: scale(1.05);
}

.search-type-btn:not(.active):hover .btn-text {
  font-weight: 600;
}

/* Animazione di caricamento per il toggle */
.toggle-wrapper::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, 
    var(--color-primary), 
    var(--color-primary-hover), 
    var(--color-primary),
    var(--color-primary-light)
  );
  border-radius: 2rem;
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
  background-size: 300% 300%;
  animation: shimmer 3s ease-in-out infinite;
}

.toggle-wrapper:hover::before {
  opacity: 0.1;
}

/* Effetto glow per il toggle attivo */
.toggle-wrapper:focus-within {
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.05),
    0 0 0 4px var(--color-primary-light);
}

/* Indicatore di stato per il tipo di ricerca selezionato */
.search-type-toggle::after {
  content: attr(data-active-type);
  position: absolute;
  top: -0.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
  white-space: nowrap;
}

.search-type-toggle:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(-0.2rem);
}

@keyframes shimmer {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Animazione per il cambio di stato */
@keyframes toggleSwitch {
  0% {
    transform: translateX(0) scale(1);
  }
  50% {
    transform: translateX(50%) scale(0.95);
  }
  100% {
    transform: translateX(100%) scale(1);
  }
}

.toggle-slider.slide-right {
  animation: toggleSwitch 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Subtle pulse effect per i bottoni */
@keyframes subtlePulse {
  0% {
    box-shadow: 0 0 0 0 var(--color-primary);
  }
  70% {
    box-shadow: 0 0 0 4px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

.search-type-btn:active {
  animation: subtlePulse 0.6s ease-out;
}

.search-bar {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-input-container {
  flex: 1;
  position: relative;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 2px solid var(--color-input-border);
  border-radius: 2rem;
  font-size: 1rem;
  background: var(--color-input-background);
  transition: all 0.3s ease;
  color: var(--color-text);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.search-input::placeholder {
  color: var(--color-text-secondary);
}

.clear-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: #6b7280;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.clear-btn:hover {
  background: var(--color-primary, #fe4654);
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.search-controls {
  min-width: 180px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.filters-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  background: var(--color-background-mute, rgba(0, 0, 0, 0.05));
  border: 2px solid var(--color-border, rgba(0, 0, 0, 0.1));
  border-radius: 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text, #374151);
  transition: all 0.3s ease;
  white-space: nowrap;
  width: 100%;
  flex: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.filters-btn:hover {
  background: var(--color-border-hover, rgba(0, 0, 0, 0.1));
  border-color: var(--color-primary, #fe4654);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.filters-btn.active {
  background: var(--color-primary, #fe4654);
  color: white;
  font-weight: bold;
  border-color: var(--color-primary, #fe4654);
  box-shadow: 0 4px 15px rgba(254, 70, 84, 0.3);
}

/* Pannello filtri */
.filters-panel {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 0.8rem;
  border: 1px solid var(--color-border);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 600;
  color: var(--color-heading);
  font-size: 0.9rem;
}

.filter-select,
.filter-input {
  padding: 0.5rem 0.8rem;
  border: 1px solid var(--color-input-border);
  border-radius: 0.8rem;
  background: var(--color-input-background);
  font-size: 0.9rem;
  color: var(--color-text);
  transition: all 0.3s ease;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.close-filters-btn {
  padding: 0.6rem 1.5rem;
  background: #6b7280;
  color: white;
  border: 2px solid transparent;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.close-filters-btn:hover {
  background: var(--color-primary, #fe4654);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(254, 70, 84, 0.3);
}

.active-filters {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.active-filters-label {
  font-weight: 600;
  color: var(--color-heading);
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
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  box-shadow: 0 2px 8px var(--color-primary-light);
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
    gap: 0.8rem;
  }
  
  .search-input-container {
    min-width: auto;
    order: 1;
  }
  
  .search-type-toggle {
    order: 2;
    justify-content: center;
  }
  
  .search-controls {
    order: 3;
    min-width: auto;
    justify-content: center;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  /* Toggle responsivo per mobile */
  .toggle-wrapper {
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
  }

  .search-type-btn {
    padding: 0.6rem 1.2rem;
    min-width: auto;
    font-size: 0.85rem;
  }

  .search-type-btn .btn-text {
    font-size: 0.9rem;
  }

  /* Header ricerca responsivo */
  .search-title {
    font-size: 1.5rem;
  }

  .search-subtitle {
    font-size: 0.9rem;
  }

  .search-container {
    padding: 1rem;
  }

  /* Filtro tipo utente responsivo */
  .user-type-select {
    min-width: 140px;
    padding: 0.6rem 1rem;
    padding-right: 2.5rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .toggle-wrapper {
    max-width: 280px;
  }

  .search-type-btn {
    padding: 0.6rem 1.2rem;
    gap: 0.4rem;
  }

  .search-type-btn .btn-text {
    font-size: 0.85rem;
  }

  .search-title {
    font-size: 1.3rem;
    flex-direction: column;
    gap: 0.3rem;
  }

  .search-icon {
    font-size: 1.4rem;
  }

  .user-type-select {
    min-width: 120px;
    font-size: 0.8rem;
  }
}

/* Regole specifiche per modalità scura */
@media (prefers-color-scheme: dark) {
  .clear-btn {
    background: #9ca3af;
  }
  
  .clear-btn:hover {
    background: #fe4654;
  }
  
  .filters-btn {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
  }
  
  .filters-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #fe4654;
  }
  
  .user-type-select {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
  }
  
  .user-type-select:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #fe4654;
  }
  
  .toggle-wrapper {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .search-type-btn:not(.active) {
    color: #9ca3af;
  }
  
  .search-type-btn:not(.active):hover {
    color: #fe4654;
    background: rgba(254, 70, 84, 0.15);
  }
  
  .close-filters-btn {
    background: #9ca3af;
  }
  
  .close-filters-btn:hover {
    background: #fe4654;
  }
}

/* Supporto per dark mode tramite classe */
.dark {
  .clear-btn {
    background: #9ca3af;
  }
  
  .clear-btn:hover {
    background: #fe4654;
  }
  
  .filters-btn {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
  }
  
  .filters-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #fe4654;
  }
  
  .user-type-select {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
  }
  
  .user-type-select:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #fe4654;
  }
  
  .toggle-wrapper {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .search-type-btn:not(.active) {
    color: #9ca3af;
  }
  
  .search-type-btn:not(.active):hover {
    color: #fe4654;
    background: rgba(254, 70, 84, 0.15);
  }
  
  .close-filters-btn {
    background: #9ca3af;
  }
  
  .close-filters-btn:hover {
    background: #fe4654;
  }
}
</style>
