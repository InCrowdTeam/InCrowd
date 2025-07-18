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
    
    <div class="divider">
      <span>oppure</span>
    </div>
    
    <div id="google-signin-main" class="google-signin-container">
      <!-- Il pulsante Google verrà renderizzato qui automaticamente -->
    </div>
    
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const router = useRouter();
const userStore = useUserStore();

const login = async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email: email.value,
      password: password.value,
    });

    userStore.setToken(res.data.token);
    userStore.setUser({ ...res.data.user, userType: res.data.userType });

    if (res.data.userType === 'admin') {
      router.push('/admin/operatori');
    } else if (res.data.userType === 'operatore') {
      router.push('/moderation');
    } else {
      router.push('/');
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Errore durante il login';
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
    const res = await axios.post('http://localhost:3000/api/auth/google', {
      idToken: response.credential,
    });

    if (res.data.needsRegistration) {
      // Determina tipo: se c'è cognome, è user, altrimenti ente
      let nome = res.data.data.nome || '';
      let cognome = res.data.data.cognome || '';
      let type = 'user';
      // Se non c'è cognome, o se l'utente ha scelto ente, tutto in nome
      if (!cognome) {
        type = 'ente';
        cognome = '';
      } else {
        // Split nome Google in nome/cognome se possibile
        const parts = nome.split(' ');
        if (parts.length > 1) {
          nome = parts[0];
          cognome = parts.slice(1).join(' ');
        }
      }
      router.push({
        name: 'completeGoogleSignup',
        query: {
          nome,
          cognome,
          email: res.data.data.email,
          oauthCode: res.data.data.oauthCode,
          type
        },
      });
      return;
    }

    userStore.setUser(res.data.user);
    userStore.setToken(res.data.token);

    if (res.data.userType === 'admin') {
      router.push('/admin/operatori');
    } else if (res.data.userType === 'operatore') {
      router.push('/moderation');
    } else {
      router.push('/');
    }
  } catch (err: any) {
    // Controlla se l'errore è relativo alla necessità di registrazione
    if (err.response?.status === 404 && err.response?.data?.needsRegistration) {
      // Determina tipo: se c'è cognome, è user, altrimenti ente
      let nome = err.response.data.data.nome || '';
      let cognome = err.response.data.data.cognome || '';
      let type = 'user';
      // Se non c'è cognome, o se l'utente ha scelto ente, tutto in nome
      if (!cognome) {
        type = 'ente';
        cognome = '';
      } else {
        // Split nome Google in nome/cognome se possibile
        const parts = nome.split(' ');
        if (parts.length > 1) {
          nome = parts[0];
          cognome = parts.slice(1).join(' ');
        }
      }
      router.push({
        name: 'completeGoogleSignup',
        query: {
          nome,
          cognome,
          email: err.response.data.data.email,
          oauthCode: err.response.data.data.oauthCode,
          type
        },
      });
      return;
    }
    errorMessage.value = err.response?.data?.message || 'Errore login Google';
  }
};

onMounted(() => {
  initializeGoogleSignIn();
});
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 2.5rem auto 0 auto;
  padding: 2rem 2rem 1.5rem 2rem;
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
}

.login-container h2 {
  text-align: center;
  color: #fe4654;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.login-container form > div {
  margin-bottom: 1.1rem;
  display: flex;
  flex-direction: column;
}

.login-container label {
  font-weight: 500;
  margin-bottom: 0.3rem;
  color: #404149;
  font-size: 1.05rem;
}

.login-container input[type="email"],
.login-container input[type="password"] {
  padding: 0.7rem 1rem;
  border: 1.5px solid #fe4654;
  border-radius: 2rem;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
  background: #f8f7f3;
}

.login-container input:focus {
  border-color: #404149;
}

.login-container button[type="submit"] {
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

.login-container button[type="submit"]:hover {
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

@media (max-width: 600px) {
  .login-container {
    padding: 1rem 0.5rem;
  }
}
</style>
