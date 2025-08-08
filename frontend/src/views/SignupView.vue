<template>
  <div class="signup-container">
    <!-- Header compatto -->
    <div class="header-section">
      <h1 class="main-title">Unisciti a InCrowd</h1>
      <p class="subtitle">Crea il tuo account in pochi semplici passi</p>
      
      <!-- Progress Bar compatta -->
      <div class="progress-container">
        <div class="step-indicators">
          <div 
            v-for="(step, index) in steps" 
            :key="index"
            class="step-indicator"
            :class="{ 
              'active': currentStep === index + 1, 
              'completed': currentStep > index + 1 
            }"
          >
            <div class="step-circle">
              <span v-if="currentStep > index + 1">✓</span>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span class="step-label">{{ step.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Messages Area (fuori dalla card) -->
    <div v-if="registrationMessage" class="message-container">
      <div :class="registrationMessage && registrationMessage.startsWith('Errore') ? 'error-message' : 'success-message'">
        {{ registrationMessage }}
      </div>
    </div>

    <!-- Form Container -->
    <div class="form-container">
      <form @submit.prevent="handleSignUp" enctype="multipart/form-data">
        
        <!-- Step 1: Tipo di Account -->
        <div v-show="currentStep === 1" class="step-content">
          <div class="step-header">
            <h2>Che tipo di account vuoi creare?</h2>
          </div>
          
          <div class="account-type-grid">
            <div 
              class="account-type-card"
              :class="{ active: type === 'user' }"
              @click="selectAccountType('user')"
            >
              <div class="card-content">
                <div class="card-icon">👤</div>
                <div class="card-info">
                  <h3>Utente</h3>
                  <p>Partecipa agli eventi e crea proposte</p>
                </div>
              </div>
            </div>
            
            <div 
              class="account-type-card"
              :class="{ active: type === 'ente' }"
              @click="selectAccountType('ente')"
            >
              <div class="card-content">
                <div class="card-icon">🏢</div>
                <div class="card-info">
                  <h3>Ente/Organizzazione</h3>
                  <p>Organizza eventi e gestisci proposte</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Metodo di Registrazione -->
        <div v-show="currentStep === 2" class="step-content">
          <div class="step-header">
            <h2>Come preferisci registrarti?</h2>
          </div>

          <div class="auth-methods-horizontal">
            <!-- Google Sign-in -->
            <div class="auth-method google-method">
              <div class="method-header">
                <div class="method-icon">🚀</div>
                <h3>Accesso con Google</h3>
              </div>
              <div id="google-signup-main" class="google-signin-container"></div>
            </div>

            <div class="divider-vertical">
              <span>o</span>
            </div>

            <!-- Email e Password -->
            <div class="auth-method email-method">
              <div class="method-header">
                <div class="method-icon">📧</div>
                <h3>Email e Password</h3>
              </div>
              <button 
                type="button" 
                class="email-signup-btn"
                @click="chooseEmailSignup"
              >
                Continua con Email
              </button>
            </div>
          </div>
        </div>

        <!-- Step 3: Dettagli Account (layout orizzontale) -->
        <div v-show="currentStep === 3" class="step-content step-content-wide">
          <div class="step-header">
            <h2>Completa il tuo profilo</h2>
          </div>
          
          <div class="form-grid">
            <div class="form-column">
              <div class="form-group">
                <label for="nome" class="form-label">
                  <span class="label-icon">{{ type === 'ente' ? '🏢' : '👤' }}</span>
                  {{ type === 'ente' ? 'Nome dell\'Ente' : 'Nome' }}
                  <span class="required-asterisk">*</span>
                </label>
                <input 
                  type="text" 
                  id="nome" 
                  v-model="form.nome" 
                  class="form-input"
                  :class="{ 'error': showErrors && !form.nome.trim() }"
                  :placeholder="type === 'ente' ? 'Es: Comune di Milano' : 'Es: Mario'"
                  required 
                />
                <div v-if="showErrors && !form.nome.trim()" class="field-error">
                  Il nome è obbligatorio
                </div>
              </div>
              
              <div v-if="type === 'user'" class="form-group">
                <label for="cognome" class="form-label">
                  <span class="label-icon">👤</span>
                  Cognome
                  <span class="required-asterisk">*</span>
                </label>
                <input 
                  type="text" 
                  id="cognome" 
                  v-model="form.cognome" 
                  class="form-input"
                  :class="{ 'error': showErrors && type === 'user' && !form.cognome.trim() }"
                  placeholder="Es: Rossi"
                  required 
                />
                <div v-if="showErrors && type === 'user' && !form.cognome.trim()" class="field-error">
                  Il cognome è obbligatorio
                </div>
              </div>
              
              <div class="form-group">
                <label for="codiceFiscale" class="form-label">
                  <span class="label-icon">📄</span>
                  Codice Fiscale
                  <span class="required-asterisk">*</span>
                </label>
                <input 
                  type="text" 
                  id="codiceFiscale" 
                  v-model="form.codiceFiscale" 
                  class="form-input"
                  :class="{ 'error': showErrors && (!form.codiceFiscale.trim() || (type === 'user' && !isValidCodiceFiscale)) }"
                  :placeholder="type === 'ente' ? 'Es: 12345678901 (P.IVA/CF)' : 'Es: RSSMRA80A01H501Z'"
                  required 
                  @blur="validateCodiceFiscale"
                />
                <div v-if="showErrors && !form.codiceFiscale.trim()" class="field-error">
                  Il codice fiscale è obbligatorio
                </div>
                <div v-else-if="showErrors && form.codiceFiscale.trim() && type === 'user' && !isValidCodiceFiscale" class="field-error">
                  Codice fiscale non valido
                </div>
              </div>
              
              <div class="form-group">
                <label for="email" class="form-label">
                  <span class="label-icon">✉️</span>
                  Email
                  <span class="required-asterisk">*</span>
                </label>
                <input 
                  type="email" 
                  id="email" 
                  v-model="form.credenziali.email" 
                  class="form-input"
                  :class="{ 'error': showErrors && (!form.credenziali.email.trim() || !isValidEmail) }"
                  placeholder="mario.rossi@example.com"
                  required 
                  @blur="validateEmail"
                />
                <div v-if="showErrors && !form.credenziali.email.trim()" class="field-error">
                  L'email è obbligatoria
                </div>
                <div v-else-if="showErrors && form.credenziali.email.trim() && !isValidEmail" class="field-error">
                  Formato email non valido
                </div>
              </div>
              
              <div class="form-group">
                <label for="password" class="form-label">
                  <span class="label-icon">🔒</span>
                  Password
                  <span class="required-asterisk">*</span>
                </label>
                <input 
                  type="password" 
                  id="password" 
                  v-model="form.credenziali.password" 
                  class="form-input"
                  :class="{ 'error': showErrors && (!form.credenziali.password || !isValidPassword) }"
                  placeholder="Scegli una password sicura"
                  required 
                  @input="validatePassword"
                />
                
                <!-- Indicatori sicurezza password -->
                <div v-if="form.credenziali.password && securityControlsEnabled" class="password-strength">
                  <div class="strength-bar">
                    <div class="strength-fill" :class="passwordStrengthClass" :style="{ width: passwordStrengthPercentage + '%' }"></div>
                  </div>
                  <p class="strength-text" :class="passwordStrengthClass">
                    {{ passwordStrengthText }}
                  </p>
                </div>
                
                <!-- Requisiti password -->
                <div v-if="(form.credenziali.password || showErrors) && securityControlsEnabled" class="password-requirements">
                  <div class="requirement" :class="{ 'met': passwordChecks.length }">
                    <span class="check-icon">{{ passwordChecks.length ? '✓' : '✗' }}</span>
                    Almeno 8 caratteri
                  </div>
                  <div class="requirement" :class="{ 'met': passwordChecks.lowercase }">
                    <span class="check-icon">{{ passwordChecks.lowercase ? '✓' : '✗' }}</span>
                    Una lettera minuscola
                  </div>
                  <div class="requirement" :class="{ 'met': passwordChecks.uppercase }">
                    <span class="check-icon">{{ passwordChecks.uppercase ? '✓' : '✗' }}</span>
                    Una lettera maiuscola
                  </div>
                  <div class="requirement" :class="{ 'met': passwordChecks.number }">
                    <span class="check-icon">{{ passwordChecks.number ? '✓' : '✗' }}</span>
                    Un numero
                  </div>
                  <div class="requirement" :class="{ 'met': passwordChecks.special }">
                    <span class="check-icon">{{ passwordChecks.special ? '✓' : '✗' }}</span>
                    Un carattere speciale (!@#$%^&*)
                  </div>
                </div>
                
                <div v-if="showErrors && !form.credenziali.password" class="field-error">
                  La password è obbligatoria
                </div>
                <div v-else-if="showErrors && form.credenziali.password && !isValidPassword" class="field-error">
                  La password non soddisfa i requisiti di sicurezza
                </div>
              </div>
            </div>
            
            <div class="form-column">
              <div class="form-group">
                <label for="biografia" class="form-label">
                  <span class="label-icon">📋</span>
                  Biografia (opzionale)
                </label>
                <textarea 
                  id="biografia" 
                  v-model="form.biografia" 
                  class="form-textarea"
                  :placeholder="type === 'ente' ? 'Descrivi la tua organizzazione...' : 'Raccontaci qualcosa di te...'"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label for="fotoProfilo" class="form-label">
                  <span class="label-icon">📸</span>
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

        <!-- Navigation Buttons -->
        <div class="navigation-buttons">
          <button 
            v-if="currentStep > 1"
            type="button" 
            @click="previousStep"
            class="btn btn-secondary"
          >
            Indietro
          </button>
          
          <button 
            v-if="currentStep === 1"
            type="button" 
            @click="nextStep"
            class="btn btn-primary"
            :disabled="!type"
          >
            Continua
          </button>
          
          <button 
            v-if="currentStep === 2"
            type="button" 
            @click="nextStep"
            class="btn btn-primary"
            :disabled="!authMethodChosen"
          >
            Continua
          </button>
          
          <button 
            v-if="currentStep === 3"
            type="submit" 
            class="btn btn-success"
            :disabled="isSubmitting || !canProceedStep3"
          >
            <span v-if="isSubmitting" class="spinner"></span>
            {{ isSubmitting ? 'Creazione in corso...' : 'Crea Account' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="success-modal" @click.stop>
        <div class="success-icon">🎉</div>
        <h3>Account creato con successo!</h3>
        <p>Benvenuto in InCrowd! Ora puoi iniziare a esplorare e partecipare alla community.</p>
        <button @click="closeSuccessModal" class="btn btn-primary">Inizia subito!</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      currentStep: 1,
      isSubmitting: false,
      showSuccessModal: false,
      previewUrl: null,
      type: '',
      showPassword: true,
      registrationMessage: '',
      isEmailSignup: false,
      googleSignInCompleted: false,
      showErrors: false,
      steps: [
        { label: 'Tipo Account' },
        { label: 'Metodo' },
        { label: 'Dettagli' }
      ],
      form: {
        nome: "",
        cognome: "",
        codiceFiscale: "",
        biografia: "",
        fotoProfilo: {
          data: null,
          contentType: "",
        },
        credenziali: {
          email: "",
          password: "",
          oauthCode: "",
        },
      },
    };
  },
  computed: {
    progressPercentage() {
      return (this.currentStep / this.steps.length) * 100;
    },
    
    securityControlsEnabled() {
      return import.meta.env.VITE_ENABLE_SECURITY_CONTROLS === 'true';
    },
    
    authMethodChosen() {
      // L'utente ha scelto un metodo di autenticazione se ha fatto il login con Google 
      // o se ha scelto di procedere con email (isEmailSignup = true)
      return this.isEmailSignup || this.googleSignInCompleted;
    },
    canProceedStep3() {
      const baseFields = this.form.nome && this.form.codiceFiscale && 
                        this.form.credenziali.email && 
                        this.form.credenziali.password && 
                        this.isValidEmail && this.isValidPassword;
      
      // Per gli utenti, controlla anche il codice fiscale e cognome
      if (this.type === 'user') {
        return baseFields && this.form.cognome && this.isValidCodiceFiscale;
      }
      
      // Per gli enti, non controlliamo il formato del codice fiscale
      return baseFields;
    },
    
    // Validazioni
    isValidEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(this.form.credenziali.email);
    },
    
    isValidCodiceFiscale() {
      // Regex per codice fiscale italiano
      const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
      return cfRegex.test(this.form.codiceFiscale.toUpperCase());
    },
    
    // Controlli password
    passwordChecks() {
      const password = this.form.credenziali.password || '';
      return {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      };
    },
    
    isValidPassword() {
      const securityEnabled = import.meta.env.VITE_ENABLE_SECURITY_CONTROLS === 'true';
      
      if (!securityEnabled) {
        // Controllo semplice per sviluppo
        return this.form.credenziali.password && this.form.credenziali.password.length >= 6;
      }
      
      // Controlli completi per produzione
      const checks = this.passwordChecks;
      return checks.length && checks.lowercase && checks.uppercase && checks.number && checks.special;
    },
    
    passwordStrengthScore() {
      const checks = this.passwordChecks;
      let score = 0;
      if (checks.length) score++;
      if (checks.lowercase) score++;
      if (checks.uppercase) score++;
      if (checks.number) score++;
      if (checks.special) score++;
      return score;
    },
    
    passwordStrengthPercentage() {
      return (this.passwordStrengthScore / 5) * 100;
    },
    
    passwordStrengthClass() {
      const score = this.passwordStrengthScore;
      if (score <= 2) return 'weak';
      if (score <= 3) return 'medium';
      if (score <= 4) return 'good';
      return 'strong';
    },
    
    passwordStrengthText() {
      const score = this.passwordStrengthScore;
      if (score <= 2) return 'Password debole';
      if (score <= 3) return 'Password media';
      if (score <= 4) return 'Password buona';
      return 'Password sicura';
    }
  },
  methods: {
    selectAccountType(accountType) {
      this.type = accountType;
      this.registrationMessage = '';
    },
    
    nextStep() {
      if (this.currentStep < this.steps.length) {
        this.currentStep++;
      }
    },
    
    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },
    
    chooseEmailSignup() {
      this.isEmailSignup = true;
      this.currentStep = 3;
    },
    
    // Metodi di validazione
    validateEmail() {
      // Attiva la visualizzazione errori quando l'utente esce dal campo
      if (!this.showErrors && this.form.credenziali.email) {
        this.showErrors = true;
      }
    },
    
    validatePassword() {
      // Attiva la visualizzazione errori quando l'utente inizia a scrivere
      if (!this.showErrors && this.form.credenziali.password) {
        this.showErrors = true;
      }
    },
    
    validateCodiceFiscale() {
      // Normalizza e valida il codice fiscale
      this.form.codiceFiscale = this.form.codiceFiscale.toUpperCase();
      if (!this.showErrors && this.form.codiceFiscale) {
        this.showErrors = true;
      }
    },
    
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    
    removePhoto() {
      this.form.fotoProfilo.data = null;
      this.previewUrl = null;
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.form.fotoProfilo.data = file;
        this.form.fotoProfilo.contentType = file.type;
        
        // Crea preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewUrl = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    
    closeSuccessModal() {
      this.showSuccessModal = false;
      // Redirect to login or home
      this.$router.push('/login');
    },
    
    async handleSignUp() {
      try {
        this.isSubmitting = true;
        this.registrationMessage = '';
        this.showErrors = true; // Attiva visualizzazione errori
        
        // Verifica che tutti i campi obbligatori siano validi
        if (!this.canProceedStep3) {
          this.registrationMessage = 'Compila correttamente tutti i campi obbligatori';
          return;
        }
        
        const formData = new FormData();
        formData.append("nome", this.form.nome);
        if (this.type === 'user') {
          formData.append("cognome", this.form.cognome);
        }
        formData.append("codiceFiscale", this.form.codiceFiscale);
        formData.append("biografia", this.form.biografia);
        if (this.form.fotoProfilo.data) {
          formData.append("fotoProfilo", this.form.fotoProfilo.data);
        }
        formData.append("email", this.form.credenziali.email);
        if (this.showPassword) {
          formData.append("password", this.form.credenziali.password);
        }
        if (this.form.credenziali.oauthCode) {
          formData.append("oauthCode", this.form.credenziali.oauthCode);
        }

        const url = this.type === 'ente'
          ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/enti`
          : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/users`;

        const response = await fetch(url, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to create user");
        }
        
        this.showSuccessModal = true;
      } catch (error) {
        console.error("Error creating user:", error);
        this.registrationMessage = `Errore durante la registrazione: ${error.message}`;
      } finally {
        this.isSubmitting = false;
      }
    },
    
    async initializeGoogle() {
      try {
        if (!this.$el) {
          console.log('Componente non ancora montato, riprovo...');
          setTimeout(() => this.initializeGoogle(), 100);
          return;
        }

        if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          const scriptLoaded = new Promise((resolve, reject) => {
            script.onload = () => resolve(true);
            script.onerror = () => reject(new Error('Errore caricamento script Google'));
          });
          document.head.appendChild(script);
          await scriptLoaded;
          await new Promise(r => setTimeout(r, 1500));
        }

        if (typeof google === 'undefined') {
          console.warn('Google SDK non disponibile');
          return;
        }

        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: this.handleGoogle,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
          itp_support: true,
        });

        const main = document.getElementById('google-signup-main');
        if (main) {
          google.accounts.id.renderButton(main, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            logo_alignment: 'left',
            width: '100%'
          });
          console.log('✅ Pulsante Google renderizzato con successo');
        } else {
          console.warn('Elemento google-signup-main non trovato');
        }
      } catch (error) {
        console.error('Errore inizializzazione Google:', error);
        this.registrationMessage = 'Errore durante l\'inizializzazione dell\'autenticazione Google';
      }
    },
    
    async handleGoogle(response) {
      try {
        this.registrationMessage = '';
        console.log('🚀 Processando registrazione Google...');
        
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/google`, {
          idToken: response.credential,
        });

        if (res.data.needsRegistration) {
          console.log('📝 Registrazione necessaria, reindirizzamento...');
          this.googleSignInCompleted = true;
          this.redirectToCompleteSignup(res.data.data);
          return;
        }

        console.log('✅ Login Google riuscito, redirect alla home...');
        this.$router.push('/');
      } catch (err) {
        console.error('Errore Google registrazione:', err);
        if (err.response?.status === 404 && err.response?.data?.needsRegistration) {
          console.log('📝 Registrazione necessaria (da errore), reindirizzamento...');
          this.googleSignInCompleted = true;
          this.redirectToCompleteSignup(err.response.data.data);
          return;
        }
        this.registrationMessage = err.response?.data?.message || 'Errore durante la registrazione con Google';
      }
    },
    
    redirectToCompleteSignup(data) {
      let nome = data.nome || '';
      let cognome = data.cognome || '';
      let accountType = this.type;
      
      if (accountType === 'user') {
        if (!cognome && nome.includes(' ')) {
          const parts = nome.split(' ');
          nome = parts[0];
          cognome = parts.slice(1).join(' ');
        }
      } else {
        if (cognome) {
          nome = `${nome} ${cognome}`;
          cognome = '';
        }
      }
      
      this.$router.push({
        name: 'completeGoogleSignup',
        query: {
          nome,
          cognome,
          email: data.email,
          oauthCode: data.oauthCode,
          type: accountType,
          fotoProfilo: data.fotoProfilo ? JSON.stringify(data.fotoProfilo) : undefined
        },
      });
    },
  },
  
  watch: {
    type() {
      this.registrationMessage = '';
    },
    
    currentStep(newStep) {
      if (newStep === 2) {
        this.$nextTick(() => {
          setTimeout(() => {
            this.initializeGoogle();
          }, 100);
        });
      }
    }
  },
  
  mounted() {
    // Google verrà inizializzato quando si arriva allo step 2
  },
};
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

/* Account Type Selection */
.account-type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 0;
}

.account-type-card {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafafa;
}

.account-type-card:hover {
  border-color: #fe4654;
  background: white;
}

.account-type-card.active {
  border-color: #fe4654;
  background: #fee;
}

.card-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.card-info h3 {
  font-size: 1rem;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  font-weight: 600;
}

.card-info p {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
}

/* Auth Methods - Horizontal Layout */
.auth-methods-horizontal {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 2rem;
  align-items: center;
  margin: 0;
}

.auth-method {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  background: #fafafa;
  text-align: center;
  transition: all 0.2s ease;
}

.auth-method:hover {
  border-color: #fe4654;
  background: white;
}

.method-header {
  margin-bottom: 1rem;
}

.method-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.method-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 0.9rem;
  font-weight: 600;
}

.google-signin-container {
  display: flex;
  justify-content: center;
}

.email-signup-btn {
  width: 100%;
  padding: 0.8rem 1.2rem;
  background: linear-gradient(135deg, #fe4654, #404149);
  color: white;
  border: none;
  border-radius: 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(254, 70, 84, 0.3);
}

.email-signup-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(254, 70, 84, 0.4);
}

.divider-vertical {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f1f5f9;
  border-radius: 50%;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
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

.required-asterisk {
  color: #fe4654;
  margin-left: 0.25rem;
  font-weight: 700;
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
  box-shadow: 0 0 0 3px rgba(254, 70, 84, 0.1);
}

.form-input.error,
.form-textarea.error {
  border-color: #dc2626;
  background: #fef2f2;
}

.field-error {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 0.3rem;
  font-weight: 500;
}

/* Password Strength */
.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.3rem;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.strength-fill.weak {
  background: #dc2626;
}

.strength-fill.medium {
  background: #f59e0b;
}

.strength-fill.good {
  background: #3b82f6;
}

.strength-fill.strong {
  background: #10b981;
}

.strength-text {
  font-size: 0.8rem;
  font-weight: 500;
  margin: 0;
}

.strength-text.weak {
  color: #dc2626;
}

.strength-text.medium {
  color: #f59e0b;
}

.strength-text.good {
  color: #3b82f6;
}

.strength-text.strong {
  color: #10b981;
}

/* Password Requirements */
.password-requirements {
  margin-top: 0.5rem;
  padding: 0.8rem;
  background: #f8fafc;
  border-radius: 0.8rem;
  border: 1px solid #e2e8f0;
}

.requirement {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
  color: #64748b;
  transition: color 0.2s ease;
}

.requirement:last-child {
  margin-bottom: 0;
}

.requirement.met {
  color: #10b981;
}

.check-icon {
  margin-right: 0.5rem;
  font-weight: 600;
  font-size: 0.75rem;
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
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
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
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

.btn-primary {
  background: linear-gradient(135deg, #fe4654, #404149);
  color: white;
  margin-left: auto;
  border-radius: 1.5rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(254, 70, 84, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(254, 70, 84, 0.4);
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
  border-radius: 8px;
  padding: 0.75rem;
  margin: 1rem 0;
  font-size: 0.875rem;
  text-align: center;
}

.info {
  color: #0369a1;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 0.75rem;
  margin: 1rem 0;
  font-size: 0.875rem;
  text-align: center;
}

/* Success Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.success-modal {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
  margin: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success-modal h3 {
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.success-modal p {
  color: #64748b;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
  font-size: 0.875rem;
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
  
  .account-type-grid {
    grid-template-columns: 1fr;
  }
  
  .auth-methods-horizontal {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .divider-vertical {
    display: none;
  }
  
  .navigation-buttons {
    padding: 1rem;
    flex-direction: column;
  }
  
  .btn-primary,
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
  
  .card-content {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
}

/* Message Container fuori dalla card */
.message-container {
  margin: 1rem 1.5rem;
  z-index: 10;
}

.error-message {
  background: #fff2f2;
  color: #e74c3c;
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  border: 1px solid #e74c3c;
  font-weight: 500;
  box-shadow: 0 2px 10px rgba(231, 76, 60, 0.1);
}

.success-message {
  background: #f0fff4;
  color: #27ae60;
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  border: 1px solid #27ae60;
  font-weight: 500;
  box-shadow: 0 2px 10px rgba(39, 174, 96, 0.1);
}
</style>