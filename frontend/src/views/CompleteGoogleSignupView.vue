<template>
  <div class="signup">
    <h1>Complete Registration</h1>
    <p class="info">{{ message }}</p>
    <form @submit.prevent="handleSignUp" enctype="multipart/form-data">
      <div>
        <label for="nome">Nome:</label>
        <input type="text" id="nome" v-model="form.nome" disabled />
      </div>
      <div v-if="showCognome">
        <label for="cognome">Cognome:</label>
        <input type="text" id="cognome" v-model="form.cognome" disabled />
      </div>
      <div>
        <label for="codiceFiscale">Codice Fiscale:</label>
        <input type="text" id="codiceFiscale" v-model="form.codiceFiscale" required />
      </div>
      <div>
        <label for="biografia">Biografia:</label>
        <textarea id="biografia" v-model="form.biografia" required></textarea>
      </div>
      <div>
        <label for="fotoProfilo">Foto Profilo:</label>
        <input type="file" id="fotoProfilo" @change="handleFileUpload" />
      </div>
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="form.credenziali.email" disabled />
      </div>
      <button type="submit">Register</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

const form = ref({
  nome: route.query.nome as string || '',
  cognome: route.query.cognome as string || '',
  codiceFiscale: '',
  biografia: '',
  fotoProfilo: {
    data: null as File | null,
    contentType: ''
  },
  credenziali: {
    email: route.query.email as string || '',
    password: '',
    oauthCode: route.query.oauthCode as string || '',
  }
});

const message = 'Compila i campi mancanti per completare la registrazione';
const showCognome = ref(route.query.cognome !== undefined);

function handleFileUpload(event: any) {
  const file = event.target.files[0];
  form.value.fotoProfilo.data = file;
  form.value.fotoProfilo.contentType = file ? file.type : '';
}

async function handleSignUp() {
  const formData = new FormData();
  formData.append('nome', form.value.nome);
  if (showCognome.value) {
    formData.append('cognome', form.value.cognome);
  }
  formData.append('codiceFiscale', form.value.codiceFiscale);
  formData.append('biografia', form.value.biografia);
  if (form.value.fotoProfilo.data) {
    formData.append('fotoProfilo', form.value.fotoProfilo.data);
  }
  formData.append('email', form.value.credenziali.email);
  formData.append('oauthCode', form.value.credenziali.oauthCode);

  const url = showCognome.value
    ? 'http://localhost:3000/api/users'
    : 'http://localhost:3000/api/enti';

  await fetch(url, {
    method: 'POST',
    body: formData,
  });

  router.push('/login');
}
</script>

<style scoped>
.signup {
  max-width: 430px;
  margin: 2.5rem auto 0 auto;
  padding: 2rem 2rem 1.5rem 2rem;
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
}

.info {
  background: #f0f7ff;
  padding: 0.6rem;
  border-radius: 1rem;
  margin-bottom: 1rem;
  text-align: center;
  color: #404149;
  border: 1px solid #9ec5fe;
}
</style>
