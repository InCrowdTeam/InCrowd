<template>
    <div>
      <h2 class="text-2xl font-bold mb-4">Elenco Utenti</h2>
      <ul v-if="users.length">
        <li v-for="user in users" :key="user._id" class="mb-2 p-2 border rounded">
          {{ user.nome }} {{ user.cognome }} - {{ user.credenziali.email }}
        </li>
      </ul>
      <p v-else>Nessun utente trovato.</p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import axios from 'axios'
  import type { IUser } from "../types/User"
  
  const users = ref<IUser[]>([])
  
  onMounted(async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/users')
      users.value = res.data
    } catch (error) {
      console.error('Errore nel recupero utenti:', error)
    }
  })
  </script>
  
  <style scoped>
  ul {
    list-style-type: none;
    padding: 0;
  }
  </style>
  