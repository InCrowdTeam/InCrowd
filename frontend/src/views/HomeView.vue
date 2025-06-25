<!-- <template>
  <main>
    <TheWelcome />
  </main>

</template> -->
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
  
  <script setup lang="ts">
  import TheWelcome from '../components/TheWelcome.vue'

  import { onMounted, ref } from 'vue'
  import axios from 'axios'
  import type { IProposta } from "../types/Proposta"
const proposta = ref(null);

  const proposte = ref<IProposta[]>([])

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
  </style>
  
