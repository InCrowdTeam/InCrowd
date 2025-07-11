<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import axios from 'axios'
import type { IProposta } from "../types/Proposta"
import { useUserStore } from '@/stores/userStore'

// Funzione locale per gestire la visualizzazione delle immagini
function processImageUrl(foto: any): string {
  if (!foto || !foto.data) return '';
  
  // Gestione dei diversi tipi di dati che possono arrivare dal server
  try {
    // Se è già una stringa base64 valida
    if (typeof foto.data === 'string') {
      return `data:${foto.contentType || 'image/jpeg'};base64,${foto.data}`;
    }
    
    // Se è un array di byte
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
  const selected = ref<'classifica' | 'esplora'>('esplora')
  const userStore = useUserStore()


  // PROPOSTE FILTRATE PER CATEGORIA
  const proposteFiltrate = computed(() =>
    categoriaSelezionata.value
      ? proposte.value.filter(p => p.categoria === categoriaSelezionata.value)
      : proposte.value
  )

  //LOGICA PER I COMMENTI
  const commentiProposta = ref<any[]>([]);
  const nuovoCommento = ref("");

  async function caricaCommenti() {
    console.log("Caricamento commenti per proposta:", propostaSelezionata.value);
    if (!propostaSelezionata.value) return;
    try {
      const res = await axios.get(
        `http://localhost:3000/api/proposte/${encodeURIComponent(propostaSelezionata.value.titolo)}/commenti`
      );
      commentiProposta.value = res.data.commenti;
      console.log("Commenti caricati in caricaCommenti:", commentiProposta.value);

    } catch (err) {
      commentiProposta.value = [];
    }
  }

  async function inviaCommento() {
  if (!nuovoCommento.value.trim() || !propostaSelezionata.value || !userStore.user?._id) return;
  try {
    await axios.post(
      `http://localhost:3000/api/proposte/${encodeURIComponent(propostaSelezionata.value.titolo)}/commenti`,
      {
        contenuto: nuovoCommento.value,
        userId: userStore.user._id,
      }
    );
    nuovoCommento.value = "";
    await caricaCommenti();
    console.log("Commenti caricati_1:", commentiProposta.value);
  } catch (err) {
    alert("Errore nell'invio del commento");
  }
}

  //PROPOSTA DA APRIRE SULLA DESTRA
  const propostaSelezionata = ref<IProposta | null>(null);

  function apriDettaglio(proposta: IProposta) {
    propostaSelezionata.value = proposta;
    caricaCommenti();
    console.log("Commenti caricati:", commentiProposta.value);
  }

  function chiudiDettaglio() {
    propostaSelezionata.value = null;
  }

  //LOGICA PER IL BOTTONE HYPE
  const isHyperUser = computed(() => {
  const listaHyper = propostaSelezionata.value?.listaHyper;
  return Array.isArray(listaHyper) && listaHyper.includes(userStore.user?._id);
})

async function handleHyper() {
  if (!propostaSelezionata.value || !userStore.user?._id) return;
  console.log("Invio hyper per:", propostaSelezionata.value.titolo);
  
  try {
    // Codifica il titolo della proposta per gestire spazi e caratteri speciali nell'URL
    const res = await axios.patch(
      `http://localhost:3000/api/proposte/${encodeURIComponent(propostaSelezionata.value.titolo)}/hyper`,
      { userId: userStore.user._id }
    );
    console.log("Risposta hyper:", res.data);
    
    // Aggiorna la proposta selezionata con la risposta aggiornata
    propostaSelezionata.value = res.data;
    
    // Aggiorna anche la lista proposte
    const idx = proposte.value.findIndex(p => p.titolo === propostaSelezionata.value?.titolo);
    if (idx !== -1) proposte.value[idx] = res.data;
  } catch (err) {
    console.error("Errore hyper:", err);
    alert("Errore nell'aggiunta dell'hyper");
  }
}


  onMounted(async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/proposte')
      proposte.value = res.data
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
          <p v-if="!proposteFiltrate.length">Nessuna proposta trovata.</p>
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
          <img
            v-if="propostaSelezionata.foto"
            :src="processImageUrl(propostaSelezionata.foto)"
            alt="Immagine proposta"
            class="side-panel-img"
          />
          <h2 style="font-weight: bold;">{{ propostaSelezionata.titolo }}</h2>
          <div class="side-panel-info">
            <strong><u>Categoria:</u></strong> {{ propostaSelezionata.categoria }}<br>
            <strong><u>Descrizione:</u></strong> {{ propostaSelezionata.descrizione }}<br>
          </div>
          <div class="hyper-row">
          <button
            class="hyper-btn"
            :class="{ active: isHyperUser }"
            @click="handleHyper"
            title="Metti un hyper!"
          >
            ⚡
          </button>
          <span class="hyper-count">{{ propostaSelezionata.listaHyper?.length || 0 }}</span>
        </div>
          <!-- SEZIONE COMMENTI -->
        <div class="comment-section">
          <input
            v-model="nuovoCommento"
            @keyup.enter="inviaCommento"
            placeholder="Scrivi un commento..."
            class="comment-input"
            type="text"
          />
          <button @click="inviaCommento" class="comment-btn">Invia</button>
          <ul class="comment-list">
            <li v-for="commento in commentiProposta" :key="commento._id">
              <b>{{ commento.utente.nome || commento.utente?.nome || 'Utente' }}</b>: {{ commento.contenuto }}
            </li>
          </ul>
        </div>
      </div>
    </Transition>
    
    

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

.side-panel {
  position: fixed;
  top: 6rem;
  right: 1rem;
  width: 370px;
  height: 80vh;
  background: #f8f7f3;
  box-shadow: -2px 0 16px rgba(0,0,0,0.12);
  z-index: 200;
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  overflow-y: auto;
  transition: right 0.3s;
  display: flex;
  flex-direction: column;
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
}
.side-panel-img {
  width: 100%;
  border-radius: 1rem;
  margin-bottom: 1rem;
  object-fit: cover;
  max-height: 180px;
}
.side-panel-info {
  margin-top: 1rem;
  font-size: 1.1rem;
}
.proposte-grid.with-panel {
  margin-right: 370px;
  transition: margin-right 0.3s;
}
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
.hyper-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 1rem 0;
}
.hyper-btn {
  font-size: 1.7rem;
  background: #fff;
  border: 2px solid #fe4654;
  color: #fe4654;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.hyper-btn.active,
.hyper-btn:disabled {
  background: #fe4654;
  color: #fff;
  border-color: #fe4654;
}
.hyper-count {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fe4654;
}

.comment-section {
  margin-top: 2rem;
  background: #fff;
  border-radius: 1rem;
  padding: 1.2rem 1rem 1rem 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-input {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1.5px solid #fe4654;
  border-radius: 2rem;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
  margin-bottom: 0.5rem;
}

.comment-input:focus {
  border-color: #404149;
}

.comment-btn {
  align-self: flex-end;
  background: #fe4654;
  color: #fff;
  border: none;
  border-radius: 2rem;
  padding: 0.5rem 1.4rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 0.5rem;
}

.comment-btn:hover {
  background: #404149;
}

.comment-list {
  margin-top: 0.5rem;
  padding: 0;
  list-style: none;
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.comment-list li {
  background: #f8f7f3;
  border-radius: 1rem;
  padding: 0.7rem 1rem;
  font-size: 1rem;
  color: #404149;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  word-break: break-word;
}

.comment-list b {
  color: #fe4654;
  margin-right: 0.4rem;
}
</style>
