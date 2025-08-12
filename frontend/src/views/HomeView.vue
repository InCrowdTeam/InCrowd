<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import type { IProposta } from "../types/Proposta"
import { useUserStore } from '@/stores/userStore'
import { 
  searchProposte, 
  type SearchFilters, 
  getAllProposte
} from '@/api/propostaApi'

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
         searchFilters.value.citta
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

// LOGICA PER I COMMENTI - RIMOSSA

// PROPOSTA DA APRIRE SULLA DESTRA - RIMOSSA

// LOGICA PER IL BOTTONE HYPE - RIMOSSA

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

/* Toggle Container */
.toggle-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.toggle-switch {
  position: relative;
  display: flex;
  background: var(--color-background-mute);
  border-radius: 2rem;
  padding: 0.25rem;
  box-shadow: inset 0 2px 4px var(--color-shadow);
}

.toggle-slider {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: calc(50% - 0.25rem);
  height: calc(100% - 0.5rem);
  background: var(--color-primary);
  border-radius: 1.75rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px var(--color-primary-light);
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
  color: var(--color-text);
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
  background: rgba(255, 255, 255, 0.95);
  color: var(--color-text);
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px var(--color-shadow);
}

.hyper-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.95);
  color: var(--color-primary);
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px var(--color-shadow);
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

/* Search styles */
.search-container {
  margin-bottom: 2rem;
  background: var(--color-card-background);
  border-radius: 1.5rem;
  box-shadow: 0 4px 20px var(--color-shadow);
  padding: 1.5rem;
  border: 1px solid var(--color-border);
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
  background: var(--color-secondary);
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
  background: var(--color-primary);
  transform: translateY(-50%) scale(1.1);
}

.filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-background-mute);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.filters-btn:hover {
  background: var(--color-border-hover);
  transform: translateY(-2px);
}

.filters-btn.active {
  background: var(--color-primary);
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 15px var(--color-primary-light);
}

.filter-icon {
  font-size: 1.2rem;
}

.filters-panel {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: var(--color-background-soft);
  border-radius: 1rem;
  border: 1px solid var(--color-border);
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
  color: var(--color-heading);
  font-size: 0.9rem;
}

.filter-select,
.filter-input {
  padding: 0.6rem 1rem;
  border: 2px solid var(--color-input-border);
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
  background: var(--color-secondary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.close-filters-btn:hover {
  background: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px var(--color-primary-light);
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
