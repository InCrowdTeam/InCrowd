<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { IProposta } from "../types/Proposta";
import { useUserStore } from "@/stores/userStore";
import axios from "axios";

const userStore = useUserStore();

// Computed per verificare se è un operatore
const isOperatore = computed(() => userStore.isOperatore);

const tabs = computed(() => {
  if (isOperatore.value) {
    return []; // Nascondi i tab per gli operatori
  }
  return [
    { label: "Mie proposte", value: "mie" },
    { label: "Hyped", value: "hyped" },
    { label: "Seguiti", value: "seguiti" }
  ];
});

const selectedTab = ref(isOperatore.value ? "" : "mie");

const mieProposte = ref<IProposta[]>([]);
const hypedProposte = ref<IProposta[]>([]);
const loading = ref(true);
const error = ref('');

// Computed per mostrare nome completo
const nomeCompleto = computed(() => {
  if (userStore.user?.cognome) {
    return `${userStore.user.nome} ${userStore.user.cognome}`;
  }
  return userStore.user?.nome || 'Nome utente';
});

// Computed per biografia con supporto operatori
const biografiaUtente = computed(() => {
  if (isOperatore.value) {
    return "🔧 Operatore di InCrowd - Mi occupo della moderazione e gestione della piattaforma per garantire un'esperienza sicura e piacevole a tutti gli utenti.";
  }
  return userStore.user?.biografia || "Nessuna biografia disponibile";
});

// Computed per foto profilo
const fotoProfiloUrl = computed(() => {
  if (userStore.user?.fotoProfilo?.data) {
    return `data:${userStore.user.fotoProfilo.contentType};base64,${userStore.user.fotoProfilo.data}`;
  }
  return userStore.user?.fotoProfiloUrl || null;
});

onMounted(async () => {
  try {
    loading.value = true;
    
    // Debug: verifica autenticazione
    console.log("🔍 Debug - Token presente:", !!userStore.token);
    console.log("🔍 Debug - User presente:", !!userStore.user);
    console.log("🔍 Debug - User ID:", userStore.user?._id);
    
    // Verifica che l'utente sia autenticato
    if (!userStore.token || !userStore.user) {
      console.error("❌ Utente non autenticato");
      return;
    }
    
    // Carica le MIE proposte usando l'API dedicata
    try {
      console.log("📡 Chiamando API /my con token...");
      const mieProposteRes = await axios.get("http://localhost:3000/api/proposte/my", {
        headers: {
          Authorization: `Bearer ${userStore.token}`
        }
      });
      console.log("✅ Proposte ricevute:", mieProposteRes.data);
      mieProposte.value = mieProposteRes.data;
    } catch (err) {
      console.error("❌ Errore nel caricamento delle mie proposte:", err);
    }
    
    // Carica tutte le proposte approvate per i filtri degli hyped
    try {
      const proposteRes = await axios.get("http://localhost:3000/api/proposte");
      const allProposte = proposteRes.data;
      
      hypedProposte.value = allProposte.filter(
        (p: IProposta) => p.listaHyper?.includes(userStore.user?._id)
      );
    } catch (err) {
      console.error("Errore nel caricamento proposte hyped:", err);
    }
    
    // Aggiorna dati utente se necessario
    const userId = userStore.user?._id;
    if (userId && !userStore.user?.biografia) {
      try {
        const userRes = await axios.get(`http://localhost:3000/api/users/${userId}`);
        userStore.user = { ...userStore.user, ...userRes.data };
      } catch (err) {
        console.error("Errore nel caricamento dati utente:", err);
      }
    }
  } catch (err) {
    console.error("Errore nel caricamento profilo:", err);
    error.value = "Errore nel caricamento del profilo";
  } finally {
    loading.value = false;
  }
});

const rimuoviProposta = async (proposta: IProposta) => {
  if (!confirm(`Sei sicuro di voler rimuovere "${proposta.titolo}"?`)) return;
  
  try {
    const response = await axios.delete(
      `http://localhost:3000/api/proposte/${encodeURIComponent(proposta.titolo)}`,
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    );
    
    if (response.status === 200) {
      // Rimuovi la proposta dalla lista locale
      mieProposte.value = mieProposte.value.filter(p => p.titolo !== proposta.titolo);
      alert("Proposta eliminata con successo!");
    }
  } catch (err: any) {
    console.error("Errore nella rimozione della proposta:", err);
    const errorMessage = err.response?.data?.message || "Errore nella rimozione della proposta";
    alert(errorMessage);
  }
};

const unhypeProposta = async (proposta: IProposta) => {
  try {
    // Usa l'endpoint hyper che fa il toggle - se già hypata, la rimuove
    const response = await axios.patch(
      `http://localhost:3000/api/proposte/${encodeURIComponent(proposta.titolo)}/hyper`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    );
    
    if (response.status === 200) {
      // Rimuovi la proposta dalla lista locale
      hypedProposte.value = hypedProposte.value.filter(p => p.titolo !== proposta.titolo);
    }
  } catch (err: any) {
    console.error("Errore nell'unhype:", err);
    const errorMessage = err.response?.data?.message || "Errore nell'unhype della proposta";
    alert(errorMessage);
  }
};
</script>

<template>
  <div class="profile-container">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Caricamento profilo...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
    </div>

    <!-- Profilo caricato -->
    <div v-else>
      <!-- Sezione profilo utente -->
      <div class="profile-header">
        <div class="profile-avatar-container">
          <img
            v-if="fotoProfiloUrl"
            class="profile-avatar"
            :src="fotoProfiloUrl"
            alt="Foto profilo"
          />
          <div v-else class="profile-avatar-placeholder">
            <span>{{ nomeCompleto.charAt(0).toUpperCase() }}</span>
          </div>
        </div>
        <div class="profile-info">
          <h1 class="profile-name">{{ nomeCompleto }}</h1>
          <p class="profile-bio">
            {{ biografiaUtente }}
          </p>
          <div v-if="!isOperatore" class="profile-stats">
            <div class="stat">
              <span class="stat-number">{{ mieProposte.length }}</span>
              <span class="stat-label">Proposte</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ hypedProposte.length }}</span>
              <span class="stat-label">Hyped</span>
            </div>
          </div>
          <div v-else class="operator-info">
            <div class="operator-badge">
              <span class="operator-icon">🔧</span>
              <span class="operator-text">Operatore Ufficiale</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs (nascosti per operatori) -->
      <div v-if="!isOperatore" class="profile-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="{ active: selectedTab === tab.value }"
          @click="selectedTab = tab.value"
          class="tab-button"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Contenuto tab -->
      <div class="profile-content">
        <!-- Profilo Operatore (minimalista) -->
        <div v-if="isOperatore" class="simple-operator-profile">
          <div class="operator-welcome">
            <div class="welcome-icon">🔧</div>
            <h3>Profilo Operatore</h3>
            <p>Questo è il tuo profilo personale. Per accedere agli strumenti di moderazione, vai al <RouterLink to="/pannello-operatore" class="panel-link">Pannello Operatore</RouterLink>.</p>
          </div>
        </div>

        <!-- Mie proposte -->
        <div v-else-if="selectedTab === 'mie'" class="proposals-section">
          <div v-if="mieProposte.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>Nessuna proposta ancora</h3>
            <p>Le tue proposte appariranno qui una volta pubblicate</p>
          </div>
          <div v-else class="proposals-grid">
            <div v-for="proposta in mieProposte" :key="proposta.titolo" class="proposal-card">
              <div class="proposal-image-container">
                <img 
                  v-if="proposta.foto?.data"
                  :src="`data:${proposta.foto.contentType};base64,${proposta.foto.data}`"
                  class="proposal-image"
                  alt="Immagine proposta" 
                />
                <div v-else class="proposal-image-placeholder">
                  <span>📸</span>
                </div>
              </div>
              <div class="proposal-content">
                <div class="proposal-header">
                  <span class="proposal-hype">
                    <span class="hype-icon">⚡</span>
                    {{ proposta.listaHyper.length }}
                  </span>
                  <span class="proposal-category">{{ proposta.categoria || 'Generale' }}</span>
                </div>
                <h3 class="proposal-title">{{ proposta.titolo }}</h3>
                <p class="proposal-description">{{ proposta.descrizione }}</p>
                <div class="proposal-footer">
                  <span class="proposal-date">
                    {{ new Date(proposta.createdAt).toLocaleDateString('it-IT') }}
                  </span>
                  <button class="action-button delete-button" @click="rimuoviProposta(proposta)">
                    🗑️ Rimuovi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hyped -->
        <div v-else-if="selectedTab === 'hyped'" class="proposals-section">
          <div v-if="hypedProposte.length === 0" class="empty-state">
            <div class="empty-icon">⚡</div>
            <h3>Nessuna proposta hypata</h3>
            <p>Le proposte che hai hypato appariranno qui</p>
          </div>
          <div v-else class="proposals-grid">
            <div v-for="proposta in hypedProposte" :key="proposta.titolo" class="proposal-card">
              <div class="proposal-image-container">
                <img 
                  v-if="proposta.foto?.data"
                  :src="`data:${proposta.foto.contentType};base64,${proposta.foto.data}`"
                  class="proposal-image"
                  alt="Immagine proposta" 
                />
                <div v-else class="proposal-image-placeholder">
                  <span>📸</span>
                </div>
              </div>
              <div class="proposal-content">
                <div class="proposal-header">
                  <span class="proposal-hype">
                    <span class="hype-icon">⚡</span>
                    {{ proposta.listaHyper.length }}
                  </span>
                  <span class="proposal-category">{{ proposta.categoria || 'Generale' }}</span>
                </div>
                <h3 class="proposal-title">{{ proposta.titolo }}</h3>
                <p class="proposal-description">{{ proposta.descrizione }}</p>
                <div class="proposal-footer">
                  <span class="proposal-author">Proposta da altro utente</span>
                  <button class="action-button unhype-button" @click="unhypeProposta(proposta)">
                    ⚡ Unhype
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Seguiti -->
        <div v-else-if="selectedTab === 'seguiti'" class="proposals-section">
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>Nessun utente seguito</h3>
            <p>Gli utenti che seguirai appariranno qui</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: #f8f7f3;
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

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #fe4654;
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
  background: #fff;
  margin: 1rem 1.5rem 0.8rem 1.5rem;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
  display: flex;
  gap: 1.2rem;
  align-items: flex-start;
}

.profile-avatar-container {
  flex-shrink: 0;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fe4654;
}

.profile-avatar-placeholder {
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

.profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #404149;
  margin: 0 0 0.5rem 0;
}

.profile-bio {
  color: #666;
  margin: 0 0 1rem 0;
  line-height: 1.4;
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
  color: #666;
  margin-top: 0.2rem;
}

/* Tabs */
.profile-tabs {
  background: #fff;
  border-radius: 1rem;
  margin: 0 1.5rem 1rem 1.5rem;
  padding: 0.4rem;
  display: flex;
  gap: 0.4rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
}

.tab-button {
  flex: 1;
  background: none;
  color: #666;
  border: none;
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #404149;
}

.tab-button.active {
  background: #fe4654;
  color: #fff;
}

/* Contenuto */
.profile-content {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.proposals-section {
  width: 100%;
}

.proposals-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #404149;
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #666;
  margin: 0;
}

/* Card proposte */
.proposal-card {
  background: #fff;
  border-radius: 1.2rem;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.proposal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
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
  color: #666;
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
  background: #fee;
  color: #fe4654;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.hype-icon {
  font-size: 1rem;
}

.proposal-category {
  background: #f8f7f3;
  color: #666;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.proposal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #404149;
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
}

.proposal-description {
  color: #666;
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
  color: #666;
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

/* Stili per Operatori */
.operator-info {
  margin-top: 1rem;
}

.operator-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #fe4654, #404149);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

.operator-icon {
  font-size: 1.1rem;
}

/* Profilo operatore semplificato */
.simple-operator-profile {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.operator-welcome {
  background: #fff;
  padding: 2rem;
  border-radius: 1.2rem;
  text-align: center;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
  max-width: 500px;
}

.welcome-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.operator-welcome h3 {
  color: #404149;
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.operator-welcome p {
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.panel-link {
  color: #fe4654;
  text-decoration: none;
  font-weight: 600;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.panel-link:hover {
  border-bottom-color: #fe4654;
}

/* Responsive */
@media (min-width: 768px) {
  .proposals-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
  
  .profile-header {
    margin: 2rem 2rem 1.5rem 2rem;
  }
  
  .profile-tabs {
    margin: 0 2rem 2rem 2rem;
  }
  
  .profile-content {
    padding: 0 2rem 2rem 2rem;
  }
}

@media (min-width: 1024px) {
  .proposals-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}

@media (max-width: 767px) {
  .profile-header {
    margin: 1.5rem 1rem 1rem 1rem;
    padding: 1.5rem;
  }
  
  .profile-tabs {
    margin: 0 1rem 1.5rem 1rem;
  }
  
  .profile-content {
    padding: 0 1rem 2rem 1rem;
  }
}
</style>