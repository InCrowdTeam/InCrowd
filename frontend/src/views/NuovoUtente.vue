<template>
    <form @submit.prevent="submitForm" class="form-container">
      <h2>Registrazione Utente</h2>
  
      <label>Tipo utente:</label>
      <select v-model="user.tipo" required>
        <option value="privato">Privato</option>
        <option value="ente">Ente</option>
      </select>
  
      <label>Nome:</label>
      <input v-model="user.nome" required />
  
      <label v-if="user.tipo === 'privato'">Cognome:</label>
      <input v-if="user.tipo === 'privato'" v-model="user.cognome" />
  
      <label v-if="user.tipo === 'ente'">Codice Fiscale:</label>
      <input v-if="user.tipo === 'ente'" v-model="user.codiceFiscale" />
  
      <label>Biografia:</label>
      <textarea v-model="user.biografia" />
  
      <label>Email:</label>
      <input type="email" v-model="user.credenziali.email" required />
  
      <label>Password:</label>
      <input type="password" v-model="user.credenziali.password" required />
  
      <label>Foto profilo - URL:</label>
      <input v-model="user.fotoProfilo.url" />
  
      <label>Descrizione foto profilo:</label>
      <input v-model="user.fotoProfilo.descrizione" />
  
      <button type="submit">Crea utente</button>
    </form>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { createUser } from '@/api/userApi'
  
  const user = ref({
    tipo: 'privato',
    nome: '',
    cognome: '',
    codiceFiscale: '',
    biografia: '',
    fotoProfilo: {
      url: '',
      descrizione: ''
    },
    credenziali: {
      email: '',
      password: ''
    },
    createdAt: new Date(),
    updatedAt: new Date()
  })
  
  async function submitForm() {
    try {
      const res = await createUser(user.value)
      console.log('Utente creato:', res)
    } catch (err) {
      console.error('Errore nella creazione utente:', err)
    }
  }
  </script>
  
  <style scoped>
  .form-container {
    display: flex;
    flex-direction: column;
    max-width: 400px;
    margin: auto;
    gap: 1rem;
  }
  </style>
  