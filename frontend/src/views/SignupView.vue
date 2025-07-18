<!-- filepath: /Users/annu/Desktop/InCrowd/frontend/src/views/SignupView.vue -->
<template>
  <div class="signup">
    <h1>Sign Up</h1>
    <p v-if="registrationMessage" :class="registrationMessage && registrationMessage.startsWith('Errore') ? 'error' : 'info'">{{ registrationMessage }}</p>
    <div class="segmented">
      <button :class="{active: type==='user'}" @click="type='user'">Utente</button>
      <button :class="{active: type==='ente'}" @click="type='ente'">Ente</button>
    </div>
    <form @submit.prevent="handleSignUp" enctype="multipart/form-data">
      <div>
        <label for="nome">Nome:</label>
        <input type="text" id="nome" v-model="form.nome" required />
      </div>
      <div v-if="type==='user'">
        <label for="cognome">Cognome:</label>
        <input type="text" id="cognome" v-model="form.cognome" required />
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
        <input type="file" id="fotoProfilo" @change="handleFileUpload"  />
      </div>
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="form.credenziali.email" required />
      </div>
      <div v-if="showPassword">
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="form.credenziali.password" required />
      </div>
      <button type="submit">Sign Up</button>
    </form>

    <div class="divider">
      <span>oppure</span>
    </div>
    <div id="google-signup-main" class="google-signin-container"></div>
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
              type: this.type
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
              type: this.type
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
.signup {
  max-width: 430px;
  margin: 2.5rem auto 0 auto;
  padding: 2rem 2rem 1.5rem 2rem;
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
}

.signup h1 {
  text-align: center;
  color: #fe4654;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 1px;
}

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
.segmented {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}
.segmented button {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #fe4654;
  background: #f8f7f3;
  cursor: pointer;
}
.segmented button.active {
  background: #fe4654;
  color: #fff;
}

.signup form > div {
  margin-bottom: 1.1rem;
  display: flex;
  flex-direction: column;
}

.signup label {
  font-weight: 500;
  margin-bottom: 0.3rem;
  color: #404149;
  font-size: 1.05rem;
}

.signup input[type="text"],
.signup input[type="email"],
.signup input[type="password"],
.signup input[type="file"],
.signup textarea {
  padding: 0.7rem 1rem;
  border: 1.5px solid #fe4654;
  border-radius: 2rem;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
  background: #f8f7f3;
}

.signup input[type="file"] {
  padding: 0.4rem 0.5rem;
  border-radius: 1rem;
  background: #f8f7f3;
}

.signup input:focus,
.signup textarea:focus {
  border-color: #404149;
}

.signup textarea {
  min-height: 70px;
  resize: vertical;
}

.signup button[type="submit"] {
  width: 100%;
  background: #fe4654;
  color: #fff;
  border: none;
  border-radius: 2rem;
  padding: 0.7rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.7rem;
  transition: background 0.2s;
  box-shadow: 0 1px 6px rgba(254,70,84,0.07);
}

.signup button[type="submit"]:hover {
  background: #404149;
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
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

.info {
  background: #f0f7ff;
  padding: 0.6rem;
  border-radius: 1rem;
  margin-bottom: 1rem;
  text-align: center;
  color: #404149;
  border: 1px solid #9ec5fe;
}

@media (max-width: 600px) {
  .signup {
    padding: 1rem 0.5rem;
  }
}
  
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

</style>