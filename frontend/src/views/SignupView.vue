<!-- filepath: /Users/annu/Desktop/InCrowd/frontend/src/views/SignupView.vue -->
<template>
  <div class="signup-container">
    <div class="signup-card">
      <h1 class="signup-title">Registrati su InCrowd</h1>
      
      <!-- Google Sign-in in cima -->
      <div class="google-section">
        <p class="google-text">✨ Usa Google per non dover ricordare la password</p>
        <div id="google-signup-main" class="google-signin-container"></div>
      </div>

      <div class="divider">
        <span>oppure usa email e password</span>
      </div>

      <p v-if="registrationMessage" :class="registrationMessage && registrationMessage.startsWith('Errore') ? 'error' : 'info'">{{ registrationMessage }}</p>
      
      <!-- Tasti segmentati migliorati -->
      <div class="user-type-selector">
        <h3>Che tipo di account vuoi creare?</h3>
        <div class="segmented-control">
          <button 
            type="button"
            :class="{ active: type === 'user' }" 
            @click="type = 'user'"
            class="segment-btn"
          >
            <span class="segment-icon">👤</span>
            <span class="segment-text">Utente</span>
          </button>
          <button 
            type="button"
            :class="{ active: type === 'ente' }" 
            @click="type = 'ente'"
            class="segment-btn"
          >
            <span class="segment-icon">🏢</span>
            <span class="segment-text">Ente</span>
          </button>
        </div>
      </div>

      <form @submit.prevent="handleSignUp" enctype="multipart/form-data" class="signup-form">
        <div class="form-group">
          <label for="nome">Nome<span v-if="type === 'ente'"> dell'Ente</span>:</label>
          <input type="text" id="nome" v-model="form.nome" required class="form-input" />
        </div>
        
        <div v-if="type === 'user'" class="form-group">
          <label for="cognome">Cognome:</label>
          <input type="text" id="cognome" v-model="form.cognome" required class="form-input" />
        </div>
        
        <div class="form-group">
          <label for="codiceFiscale">Codice Fiscale:</label>
          <input type="text" id="codiceFiscale" v-model="form.codiceFiscale" required class="form-input" />
        </div>
        
        <div class="form-group">
          <label for="biografia">Biografia:</label>
          <textarea id="biografia" v-model="form.biografia" required class="form-textarea"></textarea>
        </div>
        
        <div class="form-group">
          <label for="fotoProfilo">Foto Profilo:</label>
          <input type="file" id="fotoProfilo" @change="handleFileUpload" class="form-file" />
        </div>
        
        <div class="form-group">
          <label for="email">Email:</label>
          <input type="email" id="email" v-model="form.credenziali.email" required class="form-input" />
        </div>
        
        <div v-if="showPassword" class="form-group">
          <label for="password">Password:</label>
          <input type="password" id="password" v-model="form.credenziali.password" required class="form-input" />
        </div>
        
        <button type="submit" class="signup-btn">Crea Account</button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      type: 'user',
      showPassword: true,
      registrationMessage: '',
      form: {
        nome: "",
        cognome: "",
        codiceFiscale: "",
        biografia: "",
        fotoProfilo: {
          data: null,
          contentType: "",
        }, // File immagine
        credenziali: {
          email: "",
          password: "",
          oauthCode: "",
        },
      },
    };
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      this.form.fotoProfilo.data = file;
      this.form.fotoProfilo.contentType = file ? file.type : "";
    },
    async handleSignUp() {
      try {
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
          ? 'http://localhost:3000/api/enti'
          : 'http://localhost:3000/api/users';

        const response = await fetch(url, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to create user");
        alert("Registrazione completata!");
      } catch (error) {
        console.error("Error creating user:", error);
        alert("Errore durante la registrazione");
      }
    },
    async initializeGoogle() {
      try {
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
        // @ts-ignore
        if (typeof google === 'undefined') return;
        // @ts-ignore
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
          // @ts-ignore
          google.accounts.id.renderButton(main, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            logo_alignment: 'left',
          });
        }
      } catch (error) {
        console.error('Errore inizializzazione Google:', error);
      }
    },
    async handleGoogle(response) {
      try {
        const res = await axios.post('http://localhost:3000/api/auth/google', {
          idToken: response.credential,
        });

        if (res.data.needsRegistration) {
          // Prepara i dati per la view di completamento
          let nome = res.data.data.nome || '';
          let cognome = res.data.data.cognome || '';
          if (this.type === 'user') {
            // Split nome Google in nome/cognome se possibile
            const parts = nome.split(' ');
            if (parts.length > 1) {
              nome = parts[0];
              cognome = parts.slice(1).join(' ');
            }
          } else {
            // Se ente, tutto in nome, cognome vuoto
            cognome = '';
          }
          this.$router.push({
            name: 'completeGoogleSignup',
            query: {
              nome,
              cognome,
              email: res.data.data.email,
              oauthCode: res.data.data.oauthCode,
              type: this.type,
              fotoProfilo: res.data.data.fotoProfilo ? JSON.stringify(res.data.data.fotoProfilo) : undefined
            },
          });
          return;
        }

        this.$router.push('/');
      } catch (err) {
        // Controlla se l'errore è relativo alla necessità di registrazione
        if (err.response?.status === 404 && err.response?.data?.needsRegistration) {
          // Prepara i dati per la view di completamento
          let nome = err.response.data.data.nome || '';
          let cognome = err.response.data.data.cognome || '';
          if (this.type === 'user') {
            // Split nome Google in nome/cognome se possibile
            const parts = nome.split(' ');
            if (parts.length > 1) {
              nome = parts[0];
              cognome = parts.slice(1).join(' ');
            }
          } else {
            // Se ente, tutto in nome, cognome vuoto
            cognome = '';
          }
          this.$router.push({
            name: 'completeGoogleSignup',
            query: {
              nome,
              cognome,
              email: err.response.data.data.email,
              oauthCode: err.response.data.data.oauthCode,
              type: this.type,
              fotoProfilo: err.response.data.data.fotoProfilo ? JSON.stringify(err.response.data.data.fotoProfilo) : undefined
            },
          });
          return;
        }
        // Mostra feedback errore come in LoginView.vue
        let message = (err && err.response && err.response.data && err.response.data.message)
          ? err.response.data.message
          : 'Errore login Google';
        this.registrationMessage = message;
      }
    },
  },
  mounted() {
    this.initializeGoogle();
  },
};
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
  margin: 0 0 2rem 0;
}

/* Google Section */
.google-section {
  text-align: center;
  margin-bottom: 1.5rem;
}

.google-text {
  color: #666;
  font-size: 0.95rem;
  margin: 0 0 1rem 0;
  font-style: italic;
}

.google-signin-container {
  display: flex;
  justify-content: center;
}

.google-signin-container > div {
  width: 100% !important;
  max-width: none !important;
}

.google-signin-container iframe {
  width: 100% !important;
  max-width: none !important;
}

/* Divider */
.divider {
  text-align: center;
  margin: 2rem 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e0e0e0;
  z-index: 1;
}

.divider span {
  background: #fff;
  padding: 0 1rem;
  color: #666;
  font-size: 0.9rem;
  position: relative;
  z-index: 2;
}

/* User Type Selector */
.user-type-selector {
  margin-bottom: 2rem;
}

.user-type-selector h3 {
  color: #404149;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-align: center;
}

.segmented-control {
  display: flex;
  background: #f8f7f3;
  border-radius: 1.5rem;
  padding: 0.3rem;
  border: 2px solid #e0e0e0;
}

.segment-btn {
  flex: 1;
  padding: 0.8rem 1rem;
  border: none;
  background: transparent;
  border-radius: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  color: #666;
}

.segment-btn.active {
  background: #fe4654;
  color: #fff;
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
  transform: translateY(-1px);
}

.segment-icon {
  font-size: 1.5rem;
}

.segment-text {
  font-weight: 500;
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
}

.form-input,
.form-textarea,
.form-file {
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

.form-textarea {
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
}

.form-file {
  padding: 0.6rem 1rem;
  background: #fafafa;
  border-style: dashed;
}

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

.signup-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(254, 70, 84, 0.4);
}

/* Messages */
.error {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 0.8rem;
  padding: 0.8rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-align: center;
}

.info {
  color: #0c5460;
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 0.8rem;
  padding: 0.8rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-align: center;
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
}
</style>