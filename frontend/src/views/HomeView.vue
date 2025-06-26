<!--VERSIONE 1 SENZA TOGGLE
<template>
    <div>
      <h2 class="text-2xl font-bold mb-4">Elenco Proposte</h2>
      <ul v-if="proposte.length">
        <li v-for="proposta in proposte" :key="proposta.titolo" class="mb-2 p-2 border rounded">
          {{ proposta.titolo }} - {{ proposta.descrizione }}
        </li>
      </ul>
      <p v-else>Nessuna proposta trovata.</p>
    </div>
  </template>
  FINE VERSIONE 1 SENZA TOGGLE
====================================================================-->
  
  <script setup lang="ts">
  import { onMounted, ref, computed } from 'vue'
  import axios from 'axios'
  import type { IProposta } from "../types/Proposta"
  const selected = ref<'classifica' | 'esplora'>('classifica')

  //CATEGORIE
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


// PROPOSTE FILTRATE PER CATEGORIA
const proposteFiltrate = computed(() =>
  categoriaSelezionata.value
    ? proposte.value.filter(p => p.categoria === categoriaSelezionata.value)
    : proposte.value
)

  
  const proposta = ref(null);


  onMounted(async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/proposte')
      proposte.value = res.data
      console.log('Proposte:', proposte.value)
    } catch (error) {
      console.error('Errore nel recupero proposte:', error)
    }
  })
  </script>
  
  <style scoped>
  ul {
    list-style-type: none;
    padding: 0;
  }
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
  </style>
  


<template>
  <div class="home-container">
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
        <!-- Qui il contenuto della classifica -->
        <h2>Classifica</h2>
        <p>Contenuto della classifica...</p>
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
  <div class="proposte-grid">
    <div
    v-for="proposta in proposteFiltrate"
    :key="proposta.titolo"
    class="proposta-card"
  >
      <img
        v-if="proposta.foto && proposta.foto.data"
        :src="`data:${proposta.foto.contentType};base64,${proposta.foto.data}`"
        alt="Immagine proposta"
        class="proposta-img"
      />
      
      <div class="proposta-title">{{ proposta.titolo }}</div>
    </div>
  </div>
  <p v-if="!proposteFiltrate.length">Nessuna proposta trovata.</p>
</div>
    </div>
  </div>
</template>

<style scoped>
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
</style>
