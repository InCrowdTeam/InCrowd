<template>
  <div class="signup">
    <h1>Completa la registrazione</h1>
    <p class="info">Stai completando la registrazione con Google. I dati qui sotto sono stati importati dal tuo account Google. Compila i campi mancanti per terminare la registrazione.</p>
    <form @submit.prevent="handleSignUp" enctype="multipart/form-data">
      <div>
        <label for="nome">Nome:</label>
        <input type="text" id="nome" v-model="form.nome" :disabled="true" />
      </div>
      <div v-if="showCognome">
        <label for="cognome">Cognome:</label>
        <input type="text" id="cognome" v-model="form.cognome" :disabled="true" />
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
        <input type="email" id="email" v-model="form.credenziali.email" :disabled="true" />
      </div>
      <button type="submit">Completa registrazione</button>
      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success">{{ successMessage }}</div>
    </form>
  </div>
</template>

<script setup lang="ts">

const errorMessage = ref('');
const successMessage = ref('');
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

const type = (route.query.type as string) || 'user';
const nomeGoogle = (route.query.nome as string) || '';
let cognomeGoogle = (route.query.cognome as string) || '';
if (type === 'user' && !cognomeGoogle && nomeGoogle.includes(' ')) {
  // Split automatico se manca cognome ma nome contiene spazio
  const parts = nomeGoogle.split(' ');
  cognomeGoogle = parts.slice(1).join(' ');
}
const form = ref({
  nome: nomeGoogle.split(' ')[0] || nomeGoogle,
  cognome: type === 'user' ? cognomeGoogle : '',
  codiceFiscale: '',
  biografia: '',
  fotoProfilo: {
    data: null as File | null,
    contentType: ''
  },
  credenziali: {
    email: route.query.email as string || '',
    oauthCode: route.query.oauthCode as string || '',
  }
});

const showCognome = computed(() => type === 'user' && !!form.value.cognome);

function handleFileUpload(event: any) {
  const file = event.target.files[0];
  form.value.fotoProfilo.data = file;
  form.value.fotoProfilo.contentType = file ? file.type : '';
}

async function handleSignUp() {
  errorMessage.value = '';
  successMessage.value = '';
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

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      errorMessage.value = data.message || "Errore nella registrazione.";
      return;
    }

    successMessage.value = "Registrazione completata! Ora puoi accedere.";
    setTimeout(() => {
      router.push('/login');
    }, 1200);
  } catch (err) {
    errorMessage.value = "Errore di rete nella registrazione.";
  }
}
</script>

<style scoped>
.error {
  color: #fe4654;
  text-align: center;
  margin-top: 1rem;
  font-weight: 500;
  background: #fff2f2;
  padding: 0.7rem;
  border-radius: 1rem;
  border: 1px solid #fe4654;
}
.success {
  color: #198754;
  text-align: center;
  margin-top: 1rem;
  font-weight: 500;
  background: #e6fff2;
  padding: 0.7rem;
  border-radius: 1rem;
  border: 1px solid #198754;
}
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
