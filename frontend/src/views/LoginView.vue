<template>
  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="login">
      <div>
        <label>Email</label>
        <input type="email" v-model="email" required />
      </div>
      <div>
        <label>Password</label>
        <input type="password" v-model="password" required />
      </div>
      <button type="submit">Login</button>
    </form>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';  // Importa lo store di Pinia

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const router = useRouter();

// Usa lo store di Pinia per gestire lo stato dell'utente
const userStore = useUserStore();

const login = async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email: email.value,
      password: password.value,
    });

    console.log('Login success:', res.data);

    // Salva il token e i dati dell'utente nello store di Pinia
    userStore.setToken(res.data.token);
    userStore.setUser(res.data.user);

    // Reindirizza a una pagina protetta (o home)
    router.push('/');
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Errore durante il login';
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 1rem;
}

form div {
  margin-bottom: 1rem;
}

.error {
  color: red;
}
</style>
