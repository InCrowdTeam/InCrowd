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
    
    <!-- Pulsante Google principale (V6 integrato) -->
    <div id="google-signin-main" class="google-signin-container">
      <!-- Il pulsante Google verrà renderizzato qui automaticamente -->
    </div>
    
    <!-- Dropdown per modalità alternative -->
    <details class="alternative-modes">
      <summary class="alternative-summary">🔧 Modalità alternative (debug)</summary>
      <div class="alternative-buttons">
        <button @click="loginWithGoogle" class="google-btn-alt">
          <span class="alt-label">V1</span> Accedi con Google (Originale)
        </button>

        <button @click="loginWithGoogleV2" class="google-btn-alt">
          <span class="alt-label">V2</span> Google con Debug Info
        </button>
        
        <button @click="loginWithGoogleV3" class="google-btn-alt">
          <span class="alt-label">V3</span> Google Popup Mode
        </button>

        <button @click="loginWithGoogleV4" class="google-btn-alt">
          <span class="alt-label">V4</span> Google Auto-Load Script
        </button>

        <button @click="loginWithGoogleV5" class="google-btn-alt">
          <span class="alt-label">V5</span> Google OAuth Direct
        </button>
      </div>
    </details>
    
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
    userStore.setUser({ ...res.data.user, userType: res.data.userType });

    // Reindirizza in base al ruolo
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

const loginWithGoogle = () => {
  console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

  // Inizializza Google Identity Services
  // @ts-ignore
  
  google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
    callback: async (resp: any) => {
      try {
        const res = await axios.post('http://localhost:3000/api/auth/google', { idToken: resp.credential });
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
        errorMessage.value = err.response?.data?.message || 'Errore login Google';
      }
    }
  });
  // @ts-ignore
  google.accounts.id.prompt();
};

const loginWithGoogleV2 = () => {
  console.log("Google V2 - Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
  console.log("Current origin:", window.location.origin);
  console.log("Current href:", window.location.href);
  console.log("Current host:", window.location.host);
  console.log("Current hostname:", window.location.hostname);
  console.log("Current port:", window.location.port);
  console.log("Current protocol:", window.location.protocol);

  // Controlla se lo script Google è caricato
  // @ts-ignore
  if (typeof google === 'undefined') {
    errorMessage.value = "Google Sign-In non disponibile";
    return;
  }

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    errorMessage.value = "Google Client ID mancante nella configurazione";
    return;
  }

  try {
    // @ts-ignore
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false
    });

    // @ts-ignore
    google.accounts.id.prompt((notification: any) => {
      console.log("Google prompt notification:", notification);
      if (notification.isNotDisplayed()) {
        console.log("Prompt non mostrato - motivo:", notification.getNotDisplayedReason());
        errorMessage.value = "Google prompt non disponibile: " + notification.getNotDisplayedReason();
      } else if (notification.isSkippedMoment()) {
        console.log("Prompt saltato - motivo:", notification.getSkippedReason());
        errorMessage.value = "Google prompt saltato: " + notification.getSkippedReason();
      }
    });
  } catch (error) {
    console.error("Errore inizializzazione Google V2:", error);
    errorMessage.value = "Errore inizializzazione Google Sign-In V2";
  }
};

const handleGoogleResponse = async (response: any) => {
  try {
    console.log("Token ricevuto da Google V2:", response.credential?.substring(0, 50) + "...");
    
    const res = await axios.post('http://localhost:3000/api/auth/google', { 
      idToken: response.credential 
    });
    
    console.log("Risposta backend V2:", res.data);
    
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
    console.error("Errore backend Google auth V2:", err);
    errorMessage.value = err.response?.data?.message || 'Errore login Google V2';
  }
};

const loginWithGoogleV3 = () => {
  console.log("Google V3 - Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
  console.log("Current origin:", window.location.origin);

  // Reset errori precedenti
  errorMessage.value = '';

  // Verifica se Google è disponibile
  // @ts-ignore
  if (typeof google === 'undefined') {
    errorMessage.value = "Google Sign-In library non caricata";
    return;
  }

  // Verifica Client ID
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    errorMessage.value = "Google Client ID mancante nella configurazione";
    return;
  }

  try {
    // @ts-ignore
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
      callback: handleGoogleResponseV3,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false,
      ux_mode: 'popup',
      login_uri: window.location.origin
    });

    console.log("Inizializzazione completata, tentativo prompt...");

    // @ts-ignore
    google.accounts.id.prompt((notification: any) => {
      console.log("Notification type:", notification.getMomentType());
      console.log("Notification details:", notification);
      
      if (notification.isNotDisplayed()) {
        const reason = notification.getNotDisplayedReason();
        console.log("Prompt non mostrato - motivo:", reason);
        
        switch (reason) {
          case 'browser_not_supported':
            errorMessage.value = "Browser non supportato per Google Sign-In";
            break;
          case 'invalid_client':
            errorMessage.value = "Google Client ID non valido";
            break;
          case 'missing_client_id':
            errorMessage.value = "Google Client ID mancante";
            break;
          case 'opt_out_or_no_session':
            errorMessage.value = "Sessione Google non disponibile";
            break;
          case 'secure_http_required':
            errorMessage.value = "HTTPS richiesto per Google Sign-In";
            break;
          case 'suppressed_by_user':
            errorMessage.value = "Popup bloccato dall'utente";
            break;
          default:
            errorMessage.value = `Google prompt non disponibile: ${reason}`;
        }
      } else if (notification.isSkippedMoment()) {
        const reason = notification.getSkippedReason();
        console.log("Prompt saltato - motivo:", reason);
        errorMessage.value = `Google prompt saltato: ${reason}`;
      }
    });
  } catch (error) {
    console.error("Errore inizializzazione Google V3:", error);
    errorMessage.value = "Errore inizializzazione Google Sign-In V3";
  }
};

const handleGoogleResponseV3 = async (response: any) => {
  try {
    console.log("V3 - Token ricevuto da Google:", response.credential?.substring(0, 50) + "...");
    
    const res = await axios.post('http://localhost:3000/api/auth/google', { 
      idToken: response.credential 
    });
    
    console.log("V3 - Risposta backend:", res.data);
    
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
    console.error("V3 - Errore backend Google auth:", err);
    errorMessage.value = err.response?.data?.message || 'Errore login Google V3';
  }
};

// V4 - Carica dinamicamente lo script Google e prova
const loginWithGoogleV4 = async () => {
  console.log("🚀 Google V4 - Caricamento dinamico script");
  console.log("Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
  console.log("Origin:", window.location.origin);
  
  errorMessage.value = '';
  
  try {
    // Carica lo script Google se non presente
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      console.log("📥 Caricamento script Google...");
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      const scriptLoaded = new Promise((resolve, reject) => {
        script.onload = () => {
          console.log("✅ Script Google caricato con successo");
          resolve(true);
        };
        script.onerror = () => {
          console.error("❌ Errore caricamento script Google");
          reject(new Error('Errore caricamento script Google'));
        };
      });
      
      document.head.appendChild(script);
      await scriptLoaded;
      
      // Aspetta un po' per l'inizializzazione
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // @ts-ignore
    if (typeof google === 'undefined') {
      throw new Error('Google object non disponibile dopo il caricamento');
    }
    
    console.log("🔧 Inizializzazione Google Identity Services...");
    
    // @ts-ignore
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
      callback: handleGoogleResponseV4,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    
    console.log("👀 Tentativo di mostrare il prompt...");
    
    // @ts-ignore
    google.accounts.id.prompt((notification: any) => {
      console.log("📢 Notifica Google:", notification);
      
      if (notification.isNotDisplayed()) {
        const reason = notification.getNotDisplayedReason();
        console.error("❌ Prompt non mostrato:", reason);
        
        // Errori più specifici per il debug
        const errorMap = {
          'browser_not_supported': 'Browser non supportato per Google Sign-In',
          'invalid_client': 'Google Client ID non valido - Verifica la configurazione',
          'missing_client_id': 'Google Client ID mancante',
          'opt_out_or_no_session': 'Nessuna sessione Google attiva',
          'secure_http_required': 'HTTPS richiesto (prova con localhost)',
          'suppressed_by_user': 'Popup bloccato dal browser',
          'unregistered_origin': 'Origine non registrata in Google Cloud Console'
        };
        
        errorMessage.value = errorMap[reason as keyof typeof errorMap] || `Errore Google: ${reason}`;
        
        // Suggerimenti specifici
        if (reason === 'unregistered_origin') {
          console.error(`🔧 SOLUZIONE: Aggiungi "${window.location.origin}" alle origini autorizzate in Google Cloud Console`);
          console.error("📍 Vai su: console.cloud.google.com > APIs & Services > Credentials > OAuth 2.0 Client IDs");
        }
        
      } else if (notification.isSkippedMoment()) {
        const reason = notification.getSkippedReason();
        console.warn("⏭️  Prompt saltato:", reason);
      } else {
        console.log("✅ Prompt mostrato correttamente");
      }
    });
    
  } catch (error: any) {
    console.error("💥 Errore generale V4:", error);
    errorMessage.value = `Errore V4: ${error.message}`;
  }
};

const handleGoogleResponseV4 = async (response: any) => {
  try {
    console.log("🎉 V4 - Token ricevuto da Google:", response.credential?.substring(0, 50) + "...");
    
    const res = await axios.post('http://localhost:3000/api/auth/google', { 
      idToken: response.credential 
    });
    
    console.log("🔄 V4 - Risposta backend:", res.data);
    
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
    console.error("💥 V4 - Errore backend Google auth:", err);
    errorMessage.value = err.response?.data?.message || 'Errore login Google V4';
  }
};

// V5 - BRUTAL FORCE: Bypass con redirect URL
const loginWithGoogleV5 = () => {
  console.log("🔥 Google V5 - BRUTAL FORCE MODE");
  console.log("Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
  console.log("Origin:", window.location.origin);
  
  errorMessage.value = '';

  // Costruisci URL di autenticazione Google manualmente
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = encodeURIComponent(window.location.origin + '/login');
  const scope = encodeURIComponent('openid email profile');
  const responseType = 'code';
  const state = Math.random().toString(36).substring(2, 15);
  
  // Salva lo state per la verifica
  sessionStorage.setItem('google_oauth_state', state);
  
  const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=${scope}&` +
    `response_type=${responseType}&` +
    `state=${state}&` +
    `access_type=offline&` +
    `prompt=select_account`;
  
  console.log("🌐 Redirect URL:", googleAuthUrl);
  
  // Apri in una nuova finestra
  const popup = window.open(googleAuthUrl, 'google-login', 'width=500,height=600,scrollbars=yes');
  
  // Controlla quando la finestra si chiude
  const checkClosed = setInterval(() => {
    if (popup?.closed) {
      clearInterval(checkClosed);
      console.log("🔄 Popup chiuso, controllo parametri URL...");
      checkForAuthCode();
    }
  }, 1000);
  
  // Timeout di sicurezza
  setTimeout(() => {
    if (popup && !popup.closed) {
      popup.close();
      clearInterval(checkClosed);
      errorMessage.value = "Timeout login Google";
    }
  }, 300000); // 5 minuti
};

const checkForAuthCode = () => {
  // Controlla se ci sono parametri di auth nell'URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const storedState = sessionStorage.getItem('google_oauth_state');
  
  if (code && state && state === storedState) {
    console.log("✅ Codice di autorizzazione ricevuto:", code.substring(0, 20) + "...");
    exchangeCodeForToken(code);
    
    // Pulisci URL
    window.history.replaceState({}, document.title, window.location.pathname);
    sessionStorage.removeItem('google_oauth_state');
  }
};

const exchangeCodeForToken = async (code: string) => {
  try {
    console.log("🔄 Scambio codice per token...");
    
    const res = await axios.post('http://localhost:3000/api/auth/google-oauth', { 
      code: code,
      redirectUri: window.location.origin + '/login'
    });
    
    console.log("✅ Login V5 riuscito:", res.data);
    
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
    console.error("💥 V5 - Errore backend Google OAuth:", err);
    errorMessage.value = err.response?.data?.message || 'Errore login Google V5';
  }
};

// V6 - FedCM FIXED: Risolve CORS e FedCM
const loginWithGoogleV6 = async () => {
  console.log("✨ Google V6 - FedCM FIXED MODE");
  console.log("Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
  console.log("Origin:", window.location.origin);
  
  errorMessage.value = '';

  try {
    // Prima assicuriamoci che lo script Google sia caricato
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      console.log("📥 Caricamento script Google per V6...");
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      const scriptLoaded = new Promise((resolve, reject) => {
        script.onload = () => {
          console.log("✅ Script Google V6 caricato");
          resolve(true);
        };
        script.onerror = () => {
          console.error("❌ Errore caricamento script Google V6");
          reject(new Error('Errore caricamento script Google V6'));
        };
      });
      
      document.head.appendChild(script);
      await scriptLoaded;
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // @ts-ignore
    if (typeof google === 'undefined') {
      throw new Error('Google object non disponibile in V6');
    }

    console.log("🔧 Inizializzazione V6 con configurazione CORS-friendly...");

    // Configurazione speciale per evitare errori CORS e FedCM
    // @ts-ignore
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
      callback: handleGoogleResponseV6,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true, // Abilitiamo FedCM esplicitamente
      itp_support: true, // Supporto Intelligent Tracking Prevention
      log_level: 'debug' // Debug per vedere cosa succede
    });

    console.log("🎯 V6 - Tentativo renderButton invece di prompt...");

    // Crea un div temporaneo per il pulsante Google
    const tempDiv = document.createElement('div');
    tempDiv.id = 'temp-google-signin-v6';
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '50%';
    tempDiv.style.left = '50%';
    tempDiv.style.transform = 'translate(-50%, -50%)';
    tempDiv.style.zIndex = '10000';
    tempDiv.style.background = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.style.borderRadius = '10px';
    tempDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    
    document.body.appendChild(tempDiv);

    // @ts-ignore
    google.accounts.id.renderButton(tempDiv, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left'
    });

    // Aggiungi pulsante di chiusura
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Chiudi';
    closeBtn.style.marginTop = '10px';
    closeBtn.style.padding = '5px 10px';
    closeBtn.style.background = '#f44336';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '5px';
    closeBtn.style.cursor = 'pointer';
    
    closeBtn.onclick = () => {
      document.body.removeChild(tempDiv);
    };
    
    tempDiv.appendChild(closeBtn);

    console.log("✅ V6 - Pulsante Google renderizzato con successo");

  } catch (error: any) {
    console.error("💥 Errore V6:", error);
    errorMessage.value = `Errore V6: ${error.message}`;
  }
};

const handleGoogleResponseV6 = async (response: any) => {
  try {
    console.log("🎉 V6 - Token ricevuto da Google:", response.credential?.substring(0, 50) + "...");
    
    // Rimuovi il div temporaneo se esiste
    const tempDiv = document.getElementById('temp-google-signin-v6');
    if (tempDiv) {
      document.body.removeChild(tempDiv);
    }

    const res = await axios.post('http://localhost:3000/api/auth/google', { 
      idToken: response.credential 
    });
    
    console.log("🔄 V6 - Risposta backend:", res.data);
    
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
    console.error("💥 V6 - Errore backend Google auth:", err);
    errorMessage.value = err.response?.data?.message || 'Errore login Google V6';
  }
};

// Inizializza Google V6 automaticamente al caricamento
const initializeGoogleSignIn = async () => {
  try {
    console.log("🚀 Inizializzazione automatica Google Sign-In...");
    
    // Carica lo script Google se non presente
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      console.log("📥 Caricamento script Google...");
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      const scriptLoaded = new Promise((resolve, reject) => {
        script.onload = () => {
          console.log("✅ Script Google caricato");
          resolve(true);
        };
        script.onerror = () => {
          console.error("❌ Errore caricamento script Google");
          reject(new Error('Errore caricamento script Google'));
        };
      });
      
      document.head.appendChild(script);
      await scriptLoaded;
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // @ts-ignore
    if (typeof google === 'undefined') {
      console.warn("Google object non disponibile, skip inizializzazione");
      return;
    }

    console.log("🔧 Inizializzazione Google Identity Services...");

    // @ts-ignore
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
      callback: handleMainGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
      itp_support: true
    });

    // Renderizza il pulsante nel container principale
    const mainContainer = document.getElementById('google-signin-main');
    if (mainContainer) {
      // @ts-ignore
      google.accounts.id.renderButton(mainContainer, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      });
      console.log("✅ Pulsante Google principale renderizzato");
    }

  } catch (error) {
    console.error("💥 Errore inizializzazione Google:", error);
  }
};

const handleMainGoogleResponse = async (response: any) => {
  try {
    console.log("🎉 Token ricevuto da Google principale:", response.credential?.substring(0, 50) + "...");
    
    const res = await axios.post('http://localhost:3000/api/auth/google', { 
      idToken: response.credential 
    });
    
    console.log("🔄 Risposta backend principale:", res.data);
    
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
    console.error("💥 Errore backend Google auth principale:", err);
    errorMessage.value = err.response?.data?.message || 'Errore login Google';
  }
};

// Esegui controllo al caricamento
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
}

.divider span {
  background: #fff;
  padding: 0 1rem;
  color: #666;
  font-size: 0.9rem;
}

.google-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  background: #fff;
  color: #333;
  border: 1.5px solid #e0e0e0;
  border-radius: 2rem;
  padding: 0.7rem 0;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 0.7rem;
}

.google-btn:hover {
  border-color: #404149;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.google-btn-v2 {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  background: #4285F4;
  color: #fff;
  border: 1.5px solid #4285F4;
  border-radius: 2rem;
  padding: 0.7rem 0;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(66,133,244,0.3);
  margin-bottom: 0.7rem;
}

.google-btn-v2:hover {
  background: #3367d6;
  border-color: #3367d6;
  box-shadow: 0 2px 8px rgba(66,133,244,0.4);
}

.google-btn-v3 {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  background: linear-gradient(135deg, #4285F4, #34A853, #FBBC05, #EA4335);
  color: #fff;
  border: none;
  border-radius: 2rem;
  padding: 0.7rem 0;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(66,133,244,0.3);
  margin-bottom: 0.7rem;
}

.google-btn-v3:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66,133,244,0.4);
}

.google-btn-v4 {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  background: linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4);
  color: #fff;
  border: none;
  border-radius: 2rem;
  padding: 0.7rem 0;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 10px rgba(255,107,107,0.3);
  margin-bottom: 0.7rem;
}

.google-btn-v4:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255,107,107,0.4);
}

.google-btn-v5 {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  background: linear-gradient(45deg, #ff0000, #ff8c00, #ffd700, #00ff00, #0000ff, #8b00ff);
  color: #fff;
  border: none;
  border-radius: 2rem;
  padding: 0.7rem 0;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(255,0,0,0.4);
  margin-bottom: 0.7rem;
  animation: rainbow 2s linear infinite;
}

@keyframes rainbow {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

.google-btn-v5:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(255,0,0,0.6);
}

.google-btn-v6 {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 2rem;
  padding: 0.7rem 0;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(102,126,234,0.4);
  margin-bottom: 0.7rem;
  position: relative;
  overflow: hidden;
}

.google-btn-v6:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.google-btn-v6:hover:before {
  left: 100%;
}

.google-btn-v6:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102,126,234,0.6);
}

/* Stili per il container principale Google */
.google-signin-container {
  width: 100%;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
}

/* Il pulsante Google viene renderizzato perfettamente da Google stesso - non toccare! */

/* Stili per il dropdown delle modalità alternative */
.alternative-modes {
  margin-top: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 1rem;
  overflow: hidden;
}

.alternative-summary {
  padding: 0.8rem 1rem;
  background: #f8f9fa;
  cursor: pointer;
  font-size: 0.9rem;
  color: #666;
  user-select: none;
  transition: background 0.2s;
}

.alternative-summary:hover {
  background: #e9ecef;
}

.alternative-buttons {
  padding: 0.5rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.google-btn-alt {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.8rem;
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 1rem;
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.google-btn-alt:hover {
  border-color: #4285F4;
  background: #f8f9ff;
  transform: translateX(4px);
}

.alt-label {
  background: #4285F4;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 30px;
  text-align: center;
}

.google-icon {
  flex-shrink: 0;
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
