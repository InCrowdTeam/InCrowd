<template>
  <div class="moderation">
    <input
      class="search-input"
      type="text"
      v-model="search"
      placeholder="Search proposals..."
    />
    <div v-if="filteredProposte.length" class="proposal-list">
      <div
        v-for="prop in filteredProposte"
        :key="prop.titolo"
        class="proposal-card"
      >
        <div class="card-header">
          <h3>{{ prop.titolo }}</h3>
          <div class="actions">
            <button @click="changeState(prop.titolo, 'approvata')" title="Approve">✔️</button>
            <button @click="changeState(prop.titolo, 'rifiutata')" title="Decline">❌</button>
          </div>
        </div>
        <p class="descrizione">{{ prop.descrizione }}</p>
      </div>
    </div>
    <p v-else>No proposals found.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const store = useUserStore()
const proposte = ref<any[]>([])
const search = ref('')

const fetchProposte = async () => {
  const res = await fetch('http://localhost:3000/api/proposte/pending', {
    headers: { Authorization: `Bearer ${store.token}` }
  })
  proposte.value = await res.json()
}

const changeState = async (titolo: string, stato: string) => {
  const commento = prompt('Comment (optional):') || ''
  await fetch(
    `http://localhost:3000/api/proposte/${encodeURIComponent(titolo)}/stato`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${store.token}`
      },
      body: JSON.stringify({ stato, commento })
    }
  )
  proposte.value = proposte.value.filter(p => p.titolo !== titolo)
}

onMounted(fetchProposte)

const filteredProposte = computed(() => {
  const q = search.value.toLowerCase()
  return proposte.value.filter(p =>
    p.titolo.toLowerCase().includes(q) ||
    p.descrizione.toLowerCase().includes(q)
  )
})
</script>

<style scoped>
.moderation {
  max-width: 700px;
  margin: 2rem auto;
}
.search-input {
  width: 100%;
  padding: 0.6rem 1rem;
  border: 1.5px solid #fe4654;
  border-radius: 2rem;
  margin-bottom: 1rem;
}
.proposal-card {
  position: relative;
  background: #fff;
  padding: 1rem;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  margin-bottom: 1rem;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}
.descrizione {
  margin-top: 0.5rem;
}
</style>
