<template>
  <div class="signup-container">
    <!-- Header compatto -->
    <div class="header-section">
      <h1 class="main-title">Unisciti a InCrowd</h1>
      <p class="subtitle">Crea il tuo account in pochi semplici passi</p>
      
      <!-- Progress Bar simile a SignupView -->
      <div class="progress-container">
        <div class="step-indicators">
          <div class="step-indicator completed">
            <div class="step-circle">
              <span>✓</span>
            </div>
            <span class="step-label">Tipo Account</span>
          </div>
          <div class="step-indicator completed">
            <div class="step-circle">
              <span>✓</span>
            </div>
            <span class="step-label">Google Login</span>
          </div>
          <div class="step-indicator active">
            <div class="step-circle">
              <span>3</span>
            </div>
            <span class="step-label">Dettagli</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Container -->
    <div class="form-container">
      <!-- Preview foto profilo con design migliorato -->
      <div v-if="fotoProfiloPreview" class="google-photo-section">
        <div class="profile-photo-container">
          <img :src="fotoProfiloPreview" alt="Foto profilo" class="profile-photo" />
          <div class="photo-badge">Da Google</div>
        </div>
        <p class="photo-description">Foto profilo importata dal tuo account Google</p>
      </div>
      
      <!-- Messaggi -->
      <div v-if="errorMessage" class="error">
        {{ errorMessage }}
      </div>
      
      <div v-if="successMessage" class="info">
        {{ successMessage }}
      </div>

      <form @submit.prevent="handleSignUp">
        <!-- Step Content simile a SignupView -->
        <div class="step-content step-content-wide">
          <div class="step-header">
            <h2>Completa il tuo profilo</h2>
          </div>
          
          <!-- Tipo account selezionato -->
          <div class="account-type-display">
            <div class="selected-type">
              <span class="type-icon">{{ type === 'user' ? '👤' : '🏢' }}</span>
              <span class="type-text">{{ type === 'user' ? 'Utente Privato' : 'Ente/Organizzazione' }}</span>
            </div>
          </div>
          
          <div class="form-grid">
            <div class="form-column">
              <div class="form-group">
                <label for="nome" class="form-label">
                  <span class="label-icon">{{ type === 'ente' ? '🏢' : '👤' }}</span>
                  {{ type === 'ente' ? 'Nome dell\'Ente' : 'Nome' }}
                </label>
                <input 
                  type="text" 
                  id="nome" 
                  v-model="form.nome" 
                  class="form-input"
                  :class="{ 'disabled': !!nomeGoogle }"
                  :placeholder="type === 'ente' ? 'Es: Comune di Milano' : 'Es: Mario'"
                  required 
                  :disabled="!!nomeGoogle"
                />
                <small v-if="!!nomeGoogle" class="input-note">Importato da Google</small>
              </div>
              
              <div v-if="type === 'user'" class="form-group">
                <label for="cognome" class="form-label">
                  <span class="label-icon">👤</span>
                  Cognome
                </label>
                <input 
                  type="text" 
                  id="cognome" 
                  v-model="form.cognome" 
                  class="form-input"
                  :class="{ 'disabled': !!cognomeGoogle }"
                  placeholder="Es: Rossi"
                  required 
                  :disabled="!!cognomeGoogle"
                />
                <small v-if="!!cognomeGoogle" class="input-note">Importato da Google</small>
              </div>
              
              <div class="form-group">
                <label for="codiceFiscale" class="form-label">
                  <span class="label-icon">📄</span>
                  Codice Fiscale
                </label>
                <input 
                  type="text" 
                  id="codiceFiscale" 
                  v-model="form.codiceFiscale" 
                  class="form-input"
                  placeholder="Es: RSSMRA80A01H501Z"
                  required 
                />
              </div>
            </div>
            
            <div class="form-column">
              <div class="form-group">
                <label for="biografia" class="form-label">
                  <span class="label-icon">�</span>
                  Biografia
                </label>
                <textarea 
                  id="biografia" 
                  v-model="form.biografia" 
                  class="form-textarea"
                  :placeholder="type === 'ente' ? 'Descrivi la tua organizzazione...' : 'Raccontaci qualcosa di te...'"
                  required
                ></textarea>
              </div>
              
              <div class="form-group">
                <label for="fotoProfilo" class="form-label">
                  <span class="label-icon">📷</span>
                  Foto Profilo (opzionale)
                </label>
                <div class="upload-area" @click="triggerFileInput">
                  <div v-if="!form.fotoProfilo.data" class="upload-placeholder">
                    <div class="upload-icon">📁</div>
                    <p class="upload-text">Clicca per selezionare</p>
                  </div>
                  <div v-else class="upload-preview">
                    <img :src="previewUrl" alt="Preview" class="preview-image" />
                    <button type="button" @click.stop="removePhoto" class="remove-btn">✕</button>
                  </div>
                </div>
                <input 
                  type="file" 
                  id="fotoProfilo" 
                  ref="fileInput"
                  @change="handleFileUpload" 
                  class="file-input-hidden"
                  accept="image/*"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons simile a SignupView -->
        <div class="navigation-buttons">
          <button 
            type="button" 
            @click="goBack"
            class="btn btn-secondary"
          >
            Indietro
          </button>
          
          <button 
            type="submit" 
            class="btn btn-success"
            :disabled="isSubmitting || !canProceed"
          >
            <span v-if="isSubmitting" class="spinner"></span>
            {{ isSubmitting ? 'Creazione in corso...' : 'Crea Account' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { login, completeGoogleSignup } from '@/api/authApi';
import { createUserWithFormData } from '@/api/userApi';
import { createEnteWithFormData } from '@/api/enteApi';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const errorMessage = ref('');
const successMessage = ref('');
const fotoProfiloPreview = ref('');
const previewUrl = ref('');
const isSubmitting = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

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
        previewUrl.value = fotoProfiloPreview.value;
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

const canProceed = computed(() => {
  const baseFields = form.value.nome && form.value.codiceFiscale && form.value.biografia;
  
  if (type.value === 'user') {
    return baseFields && form.value.cognome;
  }
  return baseFields;
});

function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

function removePhoto() {
  form.value.fotoProfilo.data = null;
  previewUrl.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function handleFileUpload(event: any) {
  const file = event.target.files[0];
  if (file) {
    form.value.fotoProfilo.data = file;
    form.value.fotoProfilo.contentType = file.type;
    
    // Aggiorna preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

function goBack() {
  router.push('/addUser');
}

async function handleSignUp() {
  errorMessage.value = '';
  successMessage.value = '';
  isSubmitting.value = true;
  
  try {
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

    // Usa le nuove API
    if (showCognome.value) {
      await createUserWithFormData(formData);
    } else {
      await createEnteWithFormData(formData);
    }

    successMessage.value = "✅ Registrazione completata! Accesso in corso...";
    
    // Login automatico
    try {
      const loginData = await login({
        email: form.value.credenziali.email,
        oauthCode: form.value.credenziali.oauthCode,
      });

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
    } catch (loginErr) {
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }
  } catch (err: any) {
    errorMessage.value = err.message || "Errore di connessione. Verifica la tua connessione internet.";
    console.error('Errore registrazione:', err);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.signup-container {
  min-height: 100vh;
  background: #f8f7f3;
  padding: 2rem 1rem;
  margin: -2rem -1rem;
  position: relative;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.main-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #404149;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 1rem;
  color: #666;
  margin: 0 0 1.5rem 0;
  font-weight: 400;
}

/* Progress Indicators */
.progress-container {
  margin: 0 auto;
}

.step-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.step-indicator.active .step-circle {
  background: linear-gradient(135deg, #fe4654, #e73c47);
  color: white;
  box-shadow: 0 4px 12px rgba(254, 70, 84, 0.4);
  transform: scale(1.05);
}

.step-indicator.completed .step-circle {
  background: linear-gradient(135deg, #404149, #2d3748);
  color: white;
  box-shadow: 0 4px 12px rgba(64, 65, 73, 0.4);
}

.step-label {
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  font-weight: 500;
}

.step-indicator.active .step-label {
  color: #fe4654;
  font-weight: 600;
}

/* Form Container */
.form-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
  overflow: hidden;
}

.step-content {
  padding: 2rem;
}

.step-content-wide {
  padding: 2rem 3rem;
}

.step-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.step-header h2 {
  font-size: 1.25rem;
  color: #404149;
  margin: 0;
  font-weight: 600;
}

/* Google Photo Section */
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

/* Account Type Display */
.account-type-display {
  margin-bottom: 2rem;
  text-align: center;
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

/* Form Grid Layout */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Form Elements */
.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #404149;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.label-icon {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.8rem 1.2rem;
  border: 2px solid #e0e0e0;
  border-radius: 1.2rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fafafa;
  outline: none;
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
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
}

.input-note {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
  margin-top: 0.3rem;
}

/* Upload Area */
.upload-area {
  border: 2px dashed #e0e0e0;
  border-radius: 1.2rem;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #fe4654;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(254, 70, 84, 0.1);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.7;
}

.upload-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.upload-preview {
  position: relative;
  display: inline-block;
}

.preview-image {
  max-width: 80px;
  max-height: 80px;
  border-radius: 1.2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: #ef4444;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.file-input-hidden {
  display: none;
}

/* Navigation Buttons */
.navigation-buttons {
  display: flex;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: #f8f7f3;
  gap: 1rem;
}

.btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: linear-gradient(135deg, #6b7280, #404149);
  color: white;
  border-radius: 1.5rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(107, 114, 128, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(107, 114, 128, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #fe4654, #404149);
  color: white;
  margin-left: auto;
  border-radius: 1.5rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(254, 70, 84, 0.3);
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(254, 70, 84, 0.4);
}

/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Messages */
.error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 1.2rem;
  padding: 0.8rem;
  margin: 1rem 0;
  font-size: 0.9rem;
  text-align: center;
}

.info {
  color: #0369a1;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 1.2rem;
  padding: 0.8rem;
  margin: 1rem 0;
  font-size: 0.9rem;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .form-container {
    margin: 0 0.5rem;
  }
  
  .step-content-wide {
    padding: 1.5rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .navigation-buttons {
    padding: 1rem;
    flex-direction: column;
  }
  
  .btn-success {
    margin-left: 0;
  }
  
  .step-indicators {
    gap: 1rem;
  }
  
  .step-circle {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
  
  .step-label {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 1.5rem;
  }
  
  .profile-photo {
    width: 70px;
    height: 70px;
  }
  
  .selected-type {
    padding: 0.6rem 1.2rem;
  }
}
</style>
