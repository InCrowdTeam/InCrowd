<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { IProposta } from "../types/Proposta";
import { useUserStore } from "@/stores/userStore";
import axios from "axios";

const userStore = useUserStore();

const tabs = [
  { label: "Mie proposte", value: "mie" },
  { label: "Hyped", value: "hyped" },
  { label: "Seguiti", value: "seguiti" }
];
const selectedTab = ref("mie");

const mieProposte = ref<IProposta[]>([]);
const hypedProposte = ref<IProposta[]>([]);
const seguiti = ref<any[]>([]);

onMounted(async () => {
  const allProposte = (await axios.get("/api/proposte")).data
  console.log("allProposte:", allProposte);
  mieProposte.value = allProposte.filter(
    (p: IProposta) => p.proponenteID === userStore.user?._id
  );
  hypedProposte.value = allProposte.filter(
    (p: IProposta) => p.listaHyper?.includes(userStore.user?._id)
  );
  const userId = userStore.user?._id;
  if (userId) {
    try{
      console.log("userId:", userId);
      const res = await axios.get(`/api/utenti/${userId}`);
      console.log("Risposta utente:", res.data);
      userStore.user = { ...userStore.user, ...res.data };
    } catch (err) {
      console.error("Errore chiamata axios:", err);
    }
  }
});
</script>

<template>
  <div class="profile-container">
    <!-- Sezione profilo utente -->
    <div class="profile-user-section">
      <img
        class="profile-avatar"
        :src="userStore.user?.fotoProfiloUrl || '/default-avatar.png'"
        alt="Avatar"
      />
      <div class="profile-user-info">
        <div class="profile-user-name">{{ userStore.user?.nome }}</div>
        <div class="profile-user-bio">{{ userStore.user?.biografia || "Nessuna biografia" }}</div>
      </div>
    </div>

    <!-- Striscia bianca (tabs) -->
    <div class="profile-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="{ active: selectedTab === tab.value }"
        @click="selectedTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Contenuto tab -->
    <div class="profile-content">
      <!-- Mie proposte -->
      <div v-if="selectedTab === 'mie'">
        <div v-for="proposta in mieProposte" :key="proposta.titolo" class="profile-proposta-card">
          <img v-if="proposta.foto && proposta.foto.data"
               :src="`data:${proposta.foto.contentType};base64,${proposta.foto.data}`"
               class="profile-proposta-img"
               alt="Immagine proposta" />
          <div class="profile-proposta-info">
            <span class="profile-proposta-hype">
              <span class="hype-icon">⚡</span> {{ proposta.listaHyper.length }}
            </span>
            <span class="profile-proposta-author">{{ userStore.user?.nome }}</span>
            <div class="profile-proposta-title">{{ proposta.titolo }}</div>
          </div>
        </div>
      </div>
      <!-- Hyped -->
      <div v-else-if="selectedTab === 'hyped'">
        <div v-for="proposta in hypedProposte" :key="proposta.titolo" class="profile-proposta-card">
          <img v-if="proposta.foto && proposta.foto.data"
               :src="`data:${proposta.foto.contentType};base64,${proposta.foto.data}`"
               class="profile-proposta-img"
               alt="Immagine proposta" />
          <div class="profile-proposta-info">
            <span class="profile-proposta-hype">
              <span class="hype-icon">⚡</span> {{ proposta.listaHyper.length }}
            </span>
            <span class="profile-proposta-author">{{ proposta.proponenteID || 'Utente' }}</span>
            <div class="profile-proposta-title">{{ proposta.titolo }}</div>
          </div>
        </div>
      </div>
      <!-- Seguiti -->
      <div v-else-if="selectedTab === 'seguiti'">
        <div v-for="ente in seguiti" :key="ente._id" class="profile-ente-card">
          <img :src="ente.logo" class="ente-logo" alt="Logo ente" />
          <span class="ente-nome">{{ ente.nome }}</span>
          <button class="unfollow-btn">Non seguire più</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: 100vh;
  padding-bottom: 80px;
}

/* Sezione utente */
.profile-user-section {
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  padding: 2rem 1.5rem 1.2rem 1.5rem;
}

.profile-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}

.profile-user-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.3rem;
}

.profile-user-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #eee;
  margin-bottom: 0.2rem;
}

.profile-user-bio {
  font-size: 1rem;
  color: #eee;
  opacity: 0.85;
  margin-top: 0.1rem;
  max-width: 220px;
  word-break: break-word;
}

/* Striscia bianca (tabs) */
.profile-tabs {
  background: #fff;
  border-radius: 1.2rem;
  margin: 0 1.2rem 1.2rem 1.2rem;
  padding: 0.5rem 0.3rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}

.profile-tabs button {
  background: none;
  color: #23232b;
  border: none;
  border-radius: 2rem;
  padding: 0.5rem 1.5rem;
  font-size: 1.05rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  opacity: 0.7;
}

.profile-tabs button.active {
  background: #fe4654;
  color: #fff;
  opacity: 1;
}

</style>