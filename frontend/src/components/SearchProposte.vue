<template>
  <div class="search-container">
    <!-- Barra di ricerca principale -->
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
            <select v-model="filters.categoria" @change="onSearch" class="filter-select">
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
              v-model="filters.citta"
              type="text"
              placeholder="Es: Milano"
              class="filter-input"
              @input="onSearch"
            />
          </div>

          <!-- Filtro stato -->
          <div class="filter-group">
            <label class="filter-label">Stato</label>
            <select v-model="filters.stato" @change="onSearch" class="filter-select">
              <option value="">Tutti gli stati</option>
              <option value="approvata">✅ Approvate</option>
              <option value="in_approvazione">⏳ In approvazione</option>
              <option value="rifiutata">❌ Rifiutate</option>
            </select>
          </div>

          <!-- Ordinamento -->
          <div class="filter-group">
            <label class="filter-label">Ordina per</label>
            <select v-model="filters.sortBy" @change="onSearch" class="filter-select">
              <option value="createdAt">📅 Data di creazione</option>
              <option value="listaHyper">⚡ Numero di hyper</option>
              <option value="titolo">🔤 Titolo</option>
            </select>
          </div>

          <!-- Direzione ordinamento -->
          <div class="filter-group">
            <label class="filter-label">Direzione</label>
            <select v-model="filters.sortOrder" @change="onSearch" class="filter-select">
              <option value="desc">⬇️ Decrescente</option>
              <option value="asc">⬆️ Crescente</option>
            </select>
          </div>
        </div>

        <!-- Azioni filtri -->
        <div class="filters-actions">
          <button @click="resetFilters" class="reset-btn">
            🔄 Reset filtri
          </button>
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
        <span v-if="filters.categoria" class="filter-tag">
          Categoria: {{ getCategoryLabel(filters.categoria) }}
          <button @click="filters.categoria = ''; onSearch()" class="tag-remove">✕</button>
        </span>
        <span v-if="filters.citta" class="filter-tag">
          Città: {{ filters.citta }}
          <button @click="filters.citta = ''; onSearch()" class="tag-remove">✕</button>
        </span>
        <span v-if="filters.stato" class="filter-tag">
          Stato: {{ getStatusLabel(filters.stato) }}
          <button @click="filters.stato = ''; onSearch()" class="tag-remove">✕</button>
        </span>
      </div>
    </div>

    <!-- Risultati ricerca -->
    <div class="search-results">
      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Ricerca in corso...</p>
      </div>

      <!-- Risultati -->
      <div v-else-if="results.length > 0" class="results-container">
        <div class="results-header">
          <h3>{{ total }} {{ total === 1 ? 'risultato trovato' : 'risultati trovati' }}</h3>
        </div>
        
        <div class="results-grid">
          <div
            v-for="proposta in results"
            :key="proposta._id"
            class="result-card"
            @click="$emit('selectProposta', proposta)"
          >
            <div class="result-image-container">
              <img 
                v-if="proposta.foto?.data"
                :src="`data:${proposta.foto.contentType};base64,${proposta.foto.data}`"
                class="result-image"
                alt="Immagine proposta" 
              />
              <div v-else class="result-image-placeholder">
                <span>📸</span>
              </div>
            </div>
            
            <div class="result-content">
              <div class="result-header">
                <h4 class="result-title">{{ proposta.titolo }}</h4>
                <span class="result-category">{{ proposta.categoria || 'Generale' }}</span>
              </div>
              
              <p class="result-description">
                {{ proposta.descrizione.substring(0, 100) }}{{ proposta.descrizione.length > 100 ? '...' : '' }}
              </p>
              
              <div class="result-footer">
                <div class="result-stats">
                  <span class="stat-item">
                    <span class="stat-icon">⚡</span>
                    {{ proposta.listaHyper?.length || 0 }}
                  </span>
                  <span v-if="proposta.luogo?.citta" class="stat-item">
                    <span class="stat-icon">📍</span>
                    {{ proposta.luogo.citta }}
                  </span>
                </div>
                <span class="result-date">
                  {{ new Date(proposta.createdAt).toLocaleDateString('it-IT') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Paginazione -->
        <div v-if="hasMore" class="pagination">
          <button 
            @click="loadMore" 
            :disabled="loadingMore"
            class="load-more-btn"
          >
            {{ loadingMore ? 'Caricamento...' : 'Carica altri risultati' }}
          </button>
        </div>
      </div>

      <!-- Nessun risultato -->
      <div v-else-if="!loading && searchExecuted" class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>Nessun risultato trovato</h3>
        <p>Prova a modificare i criteri di ricerca o i filtri</p>
      </div>

      <!-- Stato iniziale -->
      <div v-else class="initial-state">
        <div class="initial-icon">🎯</div>
        <h3>Ricerca Proposte</h3>
        <p>Usa la barra di ricerca o i filtri per trovare le proposte che ti interessano</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { searchProposte, type SearchFilters } from '@/api/propostaApi'

// Props & Emits
defineEmits<{
  selectProposta: [proposta: any]
}>()

// Stato reattivo
const searchQuery = ref('')
const showFilters = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const searchExecuted = ref(false)
const results = ref<any[]>([])
const total = ref(0)
const hasMore = ref(false)

const filters = ref<SearchFilters>({
  categoria: '',
  citta: '',
  stato: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  limit: 12,
  skip: 0
})

// Computed
const hasActiveFilters = computed(() => {
  return searchQuery.value || 
         filters.value.categoria || 
         filters.value.citta || 
         filters.value.stato
})

// Debounce timer
let searchTimeout: number

// Metodi
const onSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    executeSearch(true)
  }, 300)
}

const executeSearch = async (reset = false) => {
  if (reset) {
    filters.value.skip = 0
    results.value = []
  }

  loading.value = reset
  loadingMore.value = !reset

  try {
    const searchFilters: SearchFilters = {
      ...filters.value,
      q: searchQuery.value || undefined
    }

    const response = await searchProposte(searchFilters)
    
    if (reset) {
      results.value = response.proposte
    } else {
      results.value.push(...response.proposte)
    }
    
    total.value = response.total
    hasMore.value = response.hasMore
    searchExecuted.value = true
    
  } catch (error) {
    console.error('Errore nella ricerca:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  filters.value.skip = results.value.length
  executeSearch(false)
}

const clearSearch = () => {
  searchQuery.value = ''
  onSearch()
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const resetFilters = () => {
  searchQuery.value = ''
  filters.value = {
    categoria: '',
    citta: '',
    stato: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 12,
    skip: 0
  }
  onSearch()
}

const getCategoryLabel = (categoria: string) => {
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

const getStatusLabel = (stato: string) => {
  const statuses: Record<string, string> = {
    approvata: '✅ Approvate',
    in_approvazione: '⏳ In approvazione',
    rifiutata: '❌ Rifiutate'
  }
  return statuses[stato] || stato
}
</script>

<style scoped>
.search-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

/* Barra di ricerca */
.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-input-container {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 1rem 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 2rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #fe4654;
}

.clear-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
  padding: 0.25rem;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.clear-btn:hover {
  background-color: #f0f0f0;
}

.filters-btn {
  padding: 1rem 1.5rem;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.3s;
}

.filters-btn:hover,
.filters-btn.active {
  border-color: #fe4654;
  color: #fe4654;
}

/* Pannello filtri */
.filters-panel {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 500;
  color: #404149;
  font-size: 0.9rem;
}

.filter-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.3s;
}

.filter-input:focus,
.filter-select:focus {
  border-color: #fe4654;
}

.filters-actions {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.reset-btn,
.close-filters-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.reset-btn:hover {
  background: #f8f9fa;
}

.close-filters-btn {
  background: #fe4654;
  color: #fff;
  border-color: #fe4654;
}

.close-filters-btn:hover {
  background: #e63946;
}

/* Filtri attivi */
.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
}

.active-filters-label {
  font-weight: 500;
  color: #666;
  margin-right: 0.5rem;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fe4654;
  color: #fff;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
}

.tag-remove {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
  font-size: 0.9rem;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.tag-remove:hover {
  opacity: 1;
}

/* Risultati */
.loading-container {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #fe4654;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.results-header {
  margin-bottom: 1.5rem;
}

.results-header h3 {
  color: #404149;
  margin: 0;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.result-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.result-image-container {
  height: 180px;
  overflow: hidden;
}

.result-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-image-placeholder {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.result-content {
  padding: 1rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.result-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #404149;
  margin: 0;
  line-height: 1.3;
}

.result-category {
  background: #fe4654;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  white-space: nowrap;
}

.result-description {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0.5rem 0;
}

.result-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f0f0;
}

.result-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #666;
}

.stat-icon {
  font-size: 0.9rem;
}

.result-date {
  font-size: 0.8rem;
  color: #999;
}

/* Paginazione */
.pagination {
  text-align: center;
  padding: 2rem 0;
}

.load-more-btn {
  padding: 1rem 2rem;
  background: #fe4654;
  color: #fff;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.3s;
}

.load-more-btn:hover:not(:disabled) {
  background: #e63946;
}

.load-more-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Stati vuoti */
.no-results,
.initial-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.no-results-icon,
.initial-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-results h3,
.initial-state h3 {
  margin: 0 0 0.5rem 0;
  color: #404149;
}

.no-results p,
.initial-state p {
  margin: 0;
  color: #666;
}

/* Animazioni */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  transform-origin: top;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: scaleY(0);
}

/* Responsive */
@media (max-width: 768px) {
  .search-container {
    padding: 0.5rem;
  }
  
  .search-bar {
    flex-direction: column;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .results-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .result-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
