<template>
  <div class="signup-container">
    <div class="signup-card">
      <h1 class="signup-title">Completa la Registrazione</h1>
      <p class="signup-subtitle">✨ Ultimi dettagli per completare il tuo profilo Google</p>
      
      <!-- Preview foto profilo con design migliorato -->
      <div v-if="fotoProfiloPreview" class="google-photo-section">
        <div class="profile-photo-container">
          <img :src="fotoProfiloPreview" alt="Foto profilo" class="profile-photo" />
          <div class="photo-badge">Da Google</div>
        </div>
        <p class="photo-description">Foto profilo importata dal tuo account Google</p>
      </div>
      
      <!-- Messaggi -->
      <div v-if="errorMessage" class="message error">
        <span class="message-icon">⚠️</span>
        {{ errorMessage }}
      </div>
      
      <div v-if="successMessage" class="message success">
        <span class="message-icon">✅</span>
        {{ successMessage }}
      </div>
      
      <!-- Tipo account selezionato -->
      <div class="account-type-display">
        <h3>Tipo di account selezionato</h3>
        <div class="selected-type">
          <span class="type-icon">{{ type === 'user' ? '👤' : '🏢' }}</span>
          <span class="type-text">{{ type === 'user' ? 'Utente Privato' : 'Ente/Organizzazione' }}</span>
        </div>
      </div>
      
      <form @submit.prevent="handleSignUp" class="signup-form">
        <div class="form-group">
          <label for="nome">
            <span class="label-text">Nome{{ type === 'ente' ? ' dell\'Ente' : '' }}</span>
            <span class="required">*</span>
          </label>
          <input 
            id="nome" 
            v-model="form.nome" 
            type="text" 
            required 
            :disabled="!!nomeGoogle"
            class="form-input"
            :class="{ disabled: !!nomeGoogle }"
          />
          <small v-if="!!nomeGoogle" class="input-note">Importato da Google</small>
        </div>
        
        <div v-if="showCognome" class="form-group">
          <label for="cognome">
            <span class="label-text">Cognome</span>
            <span class="required">*</span>
          </label>
          <input 
            id="cognome" 
            v-model="form.cognome" 
            type="text" 
            required 
            :disabled="!!cognomeGoogle"
            class="form-input"
            :class="{ disabled: !!cognomeGoogle }"
          />
          <small v-if="!!cognomeGoogle" class="input-note">Importato da Google</small>
        </div>
        
        <div class="form-group">
          <label for="codiceFiscale">
            <span class="label-text">Codice Fiscale</span>
            <span class="required">*</span>
          </label>
          <input 
            id="codiceFiscale" 
            v-model="form.codiceFiscale" 
            type="text" 
            required 
            class="form-input"
            placeholder="Inserisci il tuo codice fiscale"
          />
        </div>
        
        <div class="form-group">
          <label for="biografia">
            <span class="label-text">Biografia</span>
          </label>
          <textarea 
            id="biografia" 
            v-model="form.biografia" 
            class="form-textarea"
            :placeholder="type === 'user' ? 'Racconta qualcosa di te...' : 'Descrivi la tua organizzazione...'"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="fotoProfilo">
            <span class="label-text">Foto Profilo</span>
          </label>
          <p class="input-description">Puoi caricare una nuova foto o mantenere quella di Google</p>
          <div class="file-input-wrapper">
            <input 
              id="fotoProfilo" 
              type="file" 
              accept="image/*" 
              @change="handleFileUpload"
              class="file-input"
            />
            <label for="fotoProfilo" class="file-input-label">
              <span class="file-icon">📷</span>
              <span>Carica nuova foto</span>
            </label>
          </div>
        </div>
        
        <button type="submit" class="signup-btn" :disabled="isSubmitting">
          <span v-if="!isSubmitting" class="btn-text">
            <span class="btn-icon">🚀</span>
            Completa Registrazione
          </span>
          <span v-else class="btn-loading">
            <span class="loading-spinner"></span>
            Registrazione in corso...
          </span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const errorMessage = ref('');
const successMessage = ref('');
const fotoProfiloPreview = ref('');
const isSubmitting = ref(false);

// Parametri dalla query (teniamo il GET come richiesto)
const type = computed(() => route.query.type as string || 'user');
const nomeGoogle = computed(() => {
  const nome = route.query.nome as string || '';
  return nome.includes(' ') ? nome.split(' ')[0] : nome;
});
const cognomeGoogle = computed(() => {
  const nome = route.query.nome as string || '';
  const cognome = route.query.cognome as string || '';
  if (cognome) return cognome;
  if (nome.includes(' ')) return nome.split(' ').slice(1).join(' ');
  return '';
});

onMounted(() => {
  // Gestione foto profilo da parametri GET
  if (route.query.fotoProfilo && route.query.fotoProfilo !== 'undefined') {
    try {
      const fotoData = JSON.parse(route.query.fotoProfilo as string);
      if (fotoData && fotoData.data) {
        fotoProfiloPreview.value = `data:${fotoData.contentType || 'image/jpeg'};base64,${fotoData.data}`;
      }
    } catch (error) {
      console.warn('Errore processamento foto Google:', error);
    }
  }
});

const form = ref({
  nome: nomeGoogle.value,
  cognome: cognomeGoogle.value,
  codiceFiscale: '',
  biografia: '',
  fotoProfilo: {
    data: null as File | null,
    contentType: ''
  },
  credenziali: {
    email: route.query.email as string || '',
    oauthCode: route.query.oauthCode as string || ''
  }
});

const showCognome = computed(() => type.value === 'user');

function handleFileUpload(event: any) {
  const file = event.target.files[0];
  if (file) {
    form.value.fotoProfilo.data = file;
    form.value.fotoProfilo.contentType = file.type;
    
    // Aggiorna preview
    const reader = new FileReader();
    reader.onload = (e) => {
      fotoProfiloPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

async function handleSignUp() {
  errorMessage.value = '';
  successMessage.value = '';
  isSubmitting.value = true;
  
  const formData = new FormData();
  formData.append('nome', form.value.nome.trim());
  
  if (showCognome.value) {
    formData.append('cognome', form.value.cognome.trim());
  }
  
  formData.append('codiceFiscale', form.value.codiceFiscale.trim());
  formData.append('biografia', form.value.biografia.trim());
  
  // Foto profilo se caricata
  if (form.value.fotoProfilo.data) {
    formData.append('fotoProfilo', form.value.fotoProfilo.data);
  } else if (route.query.fotoProfilo && route.query.fotoProfilo !== 'undefined') {
    // Se non è stata caricata una nuova foto ma abbiamo quella di Google
    formData.append('fotoProfiloGoogle', route.query.fotoProfilo as string);
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

    successMessage.value = "✅ Registrazione completata! Accesso in corso...";
    
    // Login automatico
    try {
      const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.value.credenziali.email,
          oauthCode: form.value.credenziali.oauthCode,
        }),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        
        userStore.setUser(loginData.user);
        userStore.setToken(loginData.token);
        userStore.setUserType(loginData.userType);

        setTimeout(() => {
          if (loginData.userType === 'admin') {
            router.push('/admin/operatori');
          } else if (loginData.userType === 'operatore') {
            router.push('/pannello-operatore');
          } else {
            router.push('/');
          }
        }, 1500);
      } else {
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (loginErr) {
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }
  } catch (err) {
    errorMessage.value = "Errore di connessione. Verifica la tua connessione internet.";
    console.error('Errore registrazione:', err);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.signup-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f7f3 0%, #fff 50%, #f8f7f3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.signup-card {
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 500px;
}

.signup-title {
  font-size: 2rem;
  font-weight: 700;
  color: #404149;
  text-align: center;
  margin: 0 0 0.5rem 0;
}

.signup-subtitle {
  color: #666;
  font-size: 0.95rem;
  margin: 0 0 2rem 0;
  font-style: italic;
  text-align: center;
}

/* Foto Google Section */
.google-photo-section {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f7f3;
  border-radius: 1.2rem;
  border: 2px solid #e0e0e0;
}

.profile-photo-container {
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
}

.profile-photo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fe4654;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.photo-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #fe4654;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 0.8rem;
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

.photo-description {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
  font-style: italic;
}

/* Messages */
.message {
  padding: 0.8rem;
  border-radius: 0.8rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.message.error {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
}

.message.success {
  color: #155724;
  background: #d4edda;
  border: 1px solid #c3e6cb;
}

.message-icon {
  font-size: 1rem;
}

/* Account Type Display */
.account-type-display {
  margin-bottom: 2rem;
  text-align: center;
}

.account-type-display h3 {
  color: #404149;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.selected-type {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f7f3;
  color: #404149;
  padding: 0.8rem 1.5rem;
  border-radius: 1.2rem;
  font-weight: 500;
  border: 2px solid #e0e0e0;
}

.type-icon {
  font-size: 1.2rem;
}

/* Form Styles */
.signup-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #404149;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.label-text {
  color: #404149;
  font-weight: 600;
  font-size: 0.95rem;
}

.required {
  color: #fe4654;
  font-weight: bold;
}

.input-description {
  font-size: 0.85rem;
  color: #666;
  margin: 0 0 0.5rem 0;
}

.input-note {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
  margin-top: 0.3rem;
}

.form-input,
.form-textarea {
  padding: 0.8rem 1.2rem;
  border: 2px solid #e0e0e0;
  border-radius: 1.2rem;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  background: #fafafa;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #fe4654;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(254, 70, 84, 0.1);
}

.form-input.disabled {
  background: #f5f5f5;
  color: #666;
  cursor: not-allowed;
  border-color: #ccc;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
}

/* File Input */
.file-input-wrapper {
  position: relative;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.file-input-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 0.6rem 1rem;
  border: 2px dashed #e0e0e0;
  border-radius: 1.2rem;
  background: #fafafa;
  color: #404149;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-input-label:hover {
  border-color: #fe4654;
  background: #fff;
  color: #fe4654;
}

.file-icon {
  font-size: 1.2rem;
}

/* Signup Button */
.signup-btn {
  background: linear-gradient(135deg, #fe4654, #404149);
  color: #fff;
  border: none;
  border-radius: 1.5rem;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(254, 70, 84, 0.3);
}

.signup-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(254, 70, 84, 0.4);
}

.signup-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-text,
.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-icon {
  font-size: 1.1rem;
}

/* Loading Spinner */
.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 640px) {
  .signup-card {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }
  
  .signup-title {
    font-size: 1.7rem;
  }
  
  .profile-photo {
    width: 70px;
    height: 70px;
  }
}

@media (max-width: 480px) {
  .signup-card {
    padding: 1.5rem 1rem;
  }
  
  .signup-title {
    font-size: 1.5rem;
  }
  
  .selected-type {
    padding: 0.6rem 1.2rem;
  }
}
</style>
