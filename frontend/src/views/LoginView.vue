<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="login-title">Accedi a InCrowd</h2>
      
      <form @submit.prevent="login" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email"
            type="email" 
            v-model="email" 
            required 
            class="form-input"
            placeholder="La tua email"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            id="password"
            type="password" 
            v-model="password" 
            required 
            class="form-input"
            placeholder="La tua password"
          />
        </div>
        <button type="submit" class="login-btn">Accedi</button>
      </form>
      
      <div class="divider">
        <span>oppure</span>
      </div>
      
      <div id="google-signin-main" class="google-signin-container">
        <!-- Il pulsante Google verrà renderizzato qui automaticamente -->
      </div>
      
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { login as loginApi, googleLogin as googleLoginApi } from '@/api/authApi';

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const router = useRouter();
const userStore = useUserStore();

const login = async () => {
  try {
    const res = await loginApi({
      email: email.value,
      password: password.value,
    });

    userStore.setToken(res.data.token);
    userStore.setUserType(res.data.userType);
    
    // Per l'admin creiamo un oggetto user specifico
    if (res.data.userType === 'admin') {
      userStore.setUser({ 
        email: email.value,
        nome: 'Admin',
        cognome: 'Sistema'
      });
    } else {
      userStore.setUser(res.data.user);
    }

    // Navigazione post-login in base al tipo utente
    if (res.data.userType === 'admin') {
      router.push('/admin/operatori'); // Pannello admin
    } else if (res.data.userType === 'operatore') {
      router.push('/pannello-operatore'); // Pannello operatori
    } else {
      router.push('/'); // Home per Enti e Utenti
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Errore durante il login';
  }
};

const initializeGoogleSignIn = async () => {
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
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // @ts-ignore
    if (typeof google === 'undefined') return;

    // @ts-ignore
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
      itp_support: true
    });

    const mainContainer = document.getElementById('google-signin-main');
    if (mainContainer) {
      // @ts-ignore
      google.accounts.id.renderButton(mainContainer, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        logo_alignment: 'left',
      });
    }
  } catch (error) {
    console.error('Errore inizializzazione Google:', error);
  }
};

const handleGoogleResponse = async (response: any) => {
  try {
    errorMessage.value = ''; // Clear previous errors
    
    const res = await googleLoginApi({
      idToken: response.credential,
    });

    if (res.needsRegistration) {
      // Account non trovato - mostra errore e non permettere registrazione
      errorMessage.value = "Account non trovato. Registrati prima di fare login.";
      return;
    }

    // Login riuscito - imposta i dati nello store
    userStore.setUser(res.data.user);
    userStore.setToken(res.data.token);
    userStore.setUserType(res.data.userType);

    // Navigazione post-login in base al tipo utente
    if (res.data.userType === 'admin') {
      router.push('/admin/operatori'); // Pannello admin
    } else if (res.data.userType === 'operatore') {
      router.push('/pannello-operatore'); // Pannello operatori
    } else {
      router.push('/'); // Home per Enti e Utenti
    }
  } catch (err: any) {
    console.error('Errore Google login:', err);
    errorMessage.value = err.message || 'Errore durante il login con Google';
  }
};

onMounted(() => {
  initializeGoogleSignIn();
});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-background-soft) 0%, var(--color-background) 50%, var(--color-background-soft) 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 5vh 1rem 1rem;
}

.login-card {
  background: var(--color-card-background);
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px var(--color-shadow);
  padding: 2rem 3rem;
  width: 100%;
  max-width: 600px;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-heading);
  text-align: center;
  margin: 0 0 1.5rem 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-text);
  font-size: 0.95rem;
}

.form-input {
  padding: 0.8rem 1.2rem;
  border: 2px solid var(--color-input-border);
  border-radius: 1.2rem;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  background: var(--color-input-background);
  color: var(--color-text);
}

.form-input:focus {
  border-color: var(--color-primary);
  background: var(--color-card-background);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.login-btn {
  background: linear-gradient(135deg, #fe4654, #404149);
  color: #fff;
  border: none;
  border-radius: 1.5rem;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(254, 70, 84, 0.3);
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(254, 70, 84, 0.4);
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
  background: var(--color-border);
  z-index: 1;
}

.divider span {
  background: var(--color-card-background);
  padding: 0 1rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  position: relative;
  z-index: 2;
}

.google-signin-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.google-signin-container > div {
  width: 100% !important;
  max-width: none !important;
}

.google-signin-container iframe {
  width: 100% !important;
  max-width: none !important;
}

.error {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 0.8rem;
  padding: 0.8rem;
  margin-top: 1rem;
  font-size: 0.9rem;
  text-align: center;
}

/* Responsive */
@media (max-width: 640px) {
  .login-card {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }
  
  .login-title {
    font-size: 1.7rem;
  }
}
</style>
