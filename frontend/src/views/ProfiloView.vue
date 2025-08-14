<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import type { IProposta } from "../types/Proposta";
import type { IUser } from "../types/User";
import { useUserStore } from "@/stores/userStore";
import { useFollowStore } from "@/stores/followStore";
import { linkGoogleAccount } from "@/api/authApi";
import { validatePassword, areSecurityControlsEnabled, validatePasswordSimple } from "@/utils/passwordValidator";
import { useModal } from '@/composables/useModal';
import { updateEnteProfile, updateEntePassword } from "@/api/enteApi";
import { deleteAccount } from "@/api/userApi";
import axios from "axios";

// Dichiarazione globale per Google Sign-In
declare global {
  interface Window {
    google: any;
  }
}

const userStore = useUserStore();
const followStore = useFollowStore();
const router = useRouter();
const { showConfirm, showSuccess, showError } = useModal();

// Computed per verificare i tipi di utente
const isOperatore = computed(() => userStore.isOperatore);
const isUser = computed(() => userStore.isUser);
const isEnte = computed(() => userStore.isEnte);
const canModifyProfile = computed(() => isUser.value || isEnte.value);

const tabs = [
  { label: "Mie proposte", value: "mie" },
  { label: "Hyped", value: "hyped" },
  { label: "Seguiti", value: "seguiti" }
];

const selectedTab = ref("mie");

const mieProposte = ref<IProposta[]>([]);
const hypedProposte = ref<IProposta[]>([]);
const utentiSeguiti = ref<IUser[]>([]);
const loading = ref(true);
const loadingSeguiti = ref(false);
const error = ref('');

// Computed per mostrare nome completo
const nomeCompleto = computed(() => {
  if (isUser.value && userStore.user?.cognome) {
    return `${userStore.user.nome} ${userStore.user.cognome}`;
  }
  return userStore.user?.nome || 'Nome utente';
});

// Computed per biografia
const biografiaUtente = computed(() => {
  return userStore.user?.biografia || "Nessuna biografia disponibile";
});

// Computed per foto profilo
const fotoProfiloUrl = computed(() => {
  if (userStore.user?.fotoProfilo?.data) {
    return `data:${userStore.user.fotoProfilo.contentType};base64,${userStore.user.fotoProfilo.data}`;
  }
  return userStore.user?.fotoProfiloUrl || null;
});

onMounted(async () => {
  try {
    loading.value = true;
    
    // Verifica che l'utente sia autenticato
    if (!userStore.token || !userStore.user) {
      console.error("❌ Utente non autenticato");
      loading.value = false;
      return;
    }
    
    // Protezione aggiuntiva: gli operatori non possono accedere al profilo
    if (userStore.isOperatore) {
      console.log("🔧 Operatore reindirizzato al pannello operatore");
      router.push('/pannello-operatore');
      return;
    }
    
    // Inizializza il form del profilo con i dati dell'utente
    profileForm.value = {
      nome: userStore.user.nome || '',
      cognome: isUser.value ? (userStore.user.cognome || '') : '', // Cognome solo per User
      email: userStore.user.credenziali?.email || '',
      biografia: userStore.user.biografia || '',
      fotoProfilo: null
    };
    
    // Carica le MIE proposte usando l'API dedicata
    try {
      const mieProposteRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/proposte/my`, {
        headers: {
          Authorization: `Bearer ${userStore.token}`
        }
      });
      // L'API /my usa successResponse che wrappa i dati in { success: true, data: [...] }
      mieProposte.value = mieProposteRes.data.data || mieProposteRes.data;
    } catch (err) {
      console.error("❌ Errore nel caricamento delle mie proposte:", err);
    }
    
    // Carica tutte le proposte approvate per i filtri degli hyped
    try {
      const proposteRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/proposte`);
      // L'API delle proposte usa successResponse che wrappa i dati
      const allProposte = proposteRes.data.data || proposteRes.data;
      
      hypedProposte.value = allProposte.filter(
        (p: IProposta) => p.listaHyper?.includes(userStore.user?._id)
      );
    } catch (err) {
      console.error("Errore nel caricamento proposte hyped:", err);
    }
    
    // Aggiorna dati utente se necessario
    const userId = userStore.user?._id;
    if (userId && !userStore.user?.biografia) {
      try {
        const userRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}`);
        const userData = userRes.data?.data || userRes.data;
        userStore.setUser({ ...userStore.user, ...userData });
      } catch (err) {
        console.error("Errore nel caricamento dati utente:", err);
      }
    }
  } catch (err) {
    console.error("Errore nel caricamento profilo:", err);
    error.value = "Errore nel caricamento del profilo";
  } finally {
    loading.value = false;
  }
});

// Funzione per caricare gli utenti seguiti
const caricaUtentiSeguiti = async () => {
  if (!userStore.user?._id) return;
  
  try {
    loadingSeguiti.value = true;
    utentiSeguiti.value = await followStore.loadFollowing(userStore.user._id);
    console.log(`✅ Caricati ${utentiSeguiti.value.length} utenti seguiti`);
  } catch (err) {
    console.error("❌ Errore nel caricamento degli utenti seguiti:", err);
    await showError("Errore nel caricamento degli utenti seguiti", "Riprova più tardi");
  } finally {
    loadingSeguiti.value = false;
  }
};

// Watcher per caricare i dati quando si cambia tab
watch(selectedTab, async (newTab) => {
  if (newTab === 'seguiti' && utentiSeguiti.value.length === 0) {
    await caricaUtentiSeguiti();
  }
});

const rimuoviProposta = async (proposta: IProposta) => {
  const result = await showConfirm(
    `Sei sicuro di voler eliminare "${proposta.titolo}"?\n\nQuesta azione non può essere annullata.`,
    'Conferma eliminazione',
    '🗑️ Elimina definitivamente',
    'Annulla'
  );
  
  if (!result) return;
  
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_BACKEND_URL}/api/proposte/${proposta._id}`,
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    );
    
    if (response.status === 200) {
      // Rimuovi la proposta dalla lista locale
      mieProposte.value = mieProposte.value.filter(p => p._id !== proposta._id);
      
      await showSuccess("Proposta eliminata con successo!");
    }
  } catch (err: any) {
    console.error("Errore nella rimozione della proposta:", err);
    const errorMessage = err.response?.data?.message || "Errore nella rimozione della proposta";
    
    await showError(
      "Non è stato possibile eliminare la proposta.",
      `Dettagli tecnici: ${errorMessage}`,
      "Errore eliminazione"
    );
  }
};

const unhypeProposta = async (proposta: IProposta) => {
  try {
    // Usa l'endpoint hyper che fa il toggle - se già hypata, la rimuove
    const response = await axios.patch(
      `${import.meta.env.VITE_BACKEND_URL}/api/proposte/${proposta._id}/hyper`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    );
    
    if (response.status === 200) {
      // Rimuovi la proposta dalla lista locale
      hypedProposte.value = hypedProposte.value.filter(p => p._id !== proposta._id);
    }
  } catch (err: any) {
    console.error("Errore nell'unhype:", err);
    const errorMessage = err.response?.data?.message || "Errore nell'unhype della proposta";
    showError("Errore nell'unhype della proposta", errorMessage);
  }
};

// Funzione per smettere di seguire un utente
const smettereSeguitoUtente = async (utente: IUser) => {
  const result = await showConfirm(
    `Sei sicuro di voler smettere di seguire ${utente.nome}?`,
    'Conferma unfollow',
    '👋 Smetti di seguire',
    'Annulla'
  );
  
  if (!result || !utente._id) return;
  
  try {
    await followStore.unfollowUser(utente._id);
    
    // Rimuovi l'utente dalla lista locale
    utentiSeguiti.value = utentiSeguiti.value.filter(u => u._id !== utente._id);
    
    await showSuccess(`Non segui più ${utente.nome}`);
  } catch (err: any) {
    console.error("❌ Errore nell'unfollow:", err);
    const errorMessage = err.response?.data?.message || "Errore nello smettere di seguire l'utente";
    await showError("Errore unfollow", errorMessage);
  }
};

// State
const showSettingsModal = ref(false);

// Impostazioni state  
const activeSection = ref('profilo');
const settingsLoading = ref(false);
const saving = ref(false);
const message = ref({ text: '', type: '' });

const profileForm = ref({
  nome: '',
  cognome: '',
  email: '',
  biografia: '',
  fotoProfilo: null as File | null
});

const credentialsForm = ref({
  newPassword: '',
  confirmPassword: ''
});

const fileInput = ref<HTMLInputElement | null>(null);

// Computed per autenticazioni
const hasLocalAuth = computed(() => userStore.user?.credenziali?.hasPassword);
const hasGoogleAuth = computed(() => userStore.user?.credenziali?.oauthCode);

// Computed per validazione password
const securityControlsEnabled = computed(() => areSecurityControlsEnabled());
const passwordValidation = computed(() => {
  if (!credentialsForm.value.newPassword) return null;
  return validatePassword(credentialsForm.value.newPassword);
});
const passwordChecks = computed(() => {
  if (!credentialsForm.value.newPassword) return null;
  return {
    length: credentialsForm.value.newPassword.length >= 8,
    lowercase: /[a-z]/.test(credentialsForm.value.newPassword),
    uppercase: /[A-Z]/.test(credentialsForm.value.newPassword),
    number: /\d/.test(credentialsForm.value.newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(credentialsForm.value.newPassword)
  };
});

// State per Google Sign-In
let googleInitialized = false;

const goToSettings = () => {
  showSettingsModal.value = true;
  
  // Determina la sezione iniziale basata sullo stato delle credenziali
  if (!hasLocalAuth.value && !hasGoogleAuth.value) {
    // Nessun metodo configurato - va direttamente a credenziali
    activeSection.value = 'credenziali';
  } else {
    // Ha almeno un metodo - inizia con profilo
    activeSection.value = 'profilo';
  }
  
  // Inizializza i dati del form con i dati attuali dell'utente
  if (userStore.user) {
    profileForm.value = {
      nome: userStore.user.nome || '',
      cognome: isUser.value ? (userStore.user.cognome || '') : '', // Cognome solo per User
      email: userStore.user.credenziali?.email || '',
      biografia: userStore.user.biografia || '',
      fotoProfilo: null
    };
  }
  
  // Inizializza Google Sign-In se necessario per la sezione credenziali
  if (!hasLocalAuth.value || !hasGoogleAuth.value) {
    nextTick(() => {
      initializeGoogleSignIn();
    });
  }
};

const closeSettingsModal = () => {
  showSettingsModal.value = false;
  clearMessage();
};

const setActiveSection = (section: string) => {
  activeSection.value = section;
  clearMessage();
  
  // Reset Google initialization quando si cambia sezione per garantire re-rendering
  if (section === 'credenziali' || section === 'setup-password') {
    googleInitialized = false;
    setTimeout(() => initializeGoogleSignIn(), 100);
  }
};

// Metodi per gestione messaggi
const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
  message.value = { text, type };
  setTimeout(() => {
    message.value = { text: '', type: '' };
  }, 5000);
};

const clearMessage = () => {
  message.value = { text: '', type: '' };
};

// Metodi per upload immagine
const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    // Validazione del file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showMessage('Seleziona un file immagine valido', 'error');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      showMessage('Il file deve essere inferiore a 5MB', 'error');
      return;
    }
    
    profileForm.value.fotoProfilo = file;
  }
};

const loadProfileData = () => {
  if (userStore.user) {
    profileForm.value = {
      nome: userStore.user.nome || '',
      cognome: isUser.value ? (userStore.user.cognome || '') : '', // Cognome solo per User
      email: userStore.user.credenziali?.email || '',
      biografia: userStore.user.biografia || '',
      fotoProfilo: null
    };
  }
};

const validateProfileForm = () => {
  if (!profileForm.value.nome.trim()) {
    showMessage('Il nome è obbligatorio', 'error');
    return false;
  }
  
  // Il cognome è obbligatorio solo per gli utenti di tipo "user"
  if (isUser.value && !profileForm.value.cognome.trim()) {
    showMessage('Il cognome è obbligatorio', 'error');
    return false;
  }
  
  if (profileForm.value.biografia.length > 500) {
    showMessage('La biografia non può superare i 500 caratteri', 'error');
    return false;
  }
  
  return true;
};

const saveProfileChanges = async () => {
  if (!validateProfileForm()) return;
  
  try {
    saving.value = true;
    clearMessage();
    
    const formData = new FormData();
    formData.append('nome', profileForm.value.nome);
    
    // Aggiungi cognome solo per User
    if (isUser.value) {
      formData.append('cognome', profileForm.value.cognome);
    }
    
    formData.append('biografia', profileForm.value.biografia);
    
    if (profileForm.value.fotoProfilo) {
      formData.append('fotoProfilo', profileForm.value.fotoProfilo);
    }
    
    let response;
    
    // Usa l'API corretta in base al tipo di utente
    if (isUser.value) {
      response = await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/profile`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${userStore.token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
    } else if (isEnte.value) {
      const result = await updateEnteProfile(userStore.token, formData);
      response = { data: result };
    } else {
      showMessage('Tipo utente non supportato per la modifica del profilo', 'error');
      return;
    }
    
    if (response.data.data || response.data) {
      const userData = response.data.data || response.data;
      userStore.setUser(userData);
      showMessage('Profilo aggiornato con successo!');
      profileForm.value.fotoProfilo = null;
      
      // Aggiorna il form con i nuovi dati per sincronizzarlo con lo store
      profileForm.value.nome = userData.nome || '';
      profileForm.value.cognome = isUser.value ? (userData.cognome || '') : '';
      profileForm.value.email = userData.credenziali?.email || '';
      profileForm.value.biografia = userData.biografia || '';
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Errore durante l\'aggiornamento del profilo';
    showMessage(errorMessage, 'error');
  } finally {
    saving.value = false;
  }
};

const validatePasswordForm = () => {
  if (!credentialsForm.value.newPassword) {
    showMessage('Inserisci la nuova password', 'error');
    return false;
  }
  
  // Usa la validazione modulare
  const securityEnabled = areSecurityControlsEnabled();
  
  if (securityEnabled) {
    const validation = validatePassword(credentialsForm.value.newPassword);
    if (!validation.isValid) {
      showMessage(validation.errors[0], 'error');
      return false;
    }
  } else {
    // Controllo semplificato per sviluppo
    if (!validatePasswordSimple(credentialsForm.value.newPassword)) {
      showMessage('La password deve contenere almeno 6 caratteri', 'error');
      return false;
    }
  }
  
  if (credentialsForm.value.newPassword !== credentialsForm.value.confirmPassword) {
    showMessage('Le password non coincidono', 'error');
    return false;
  }
  
  return true;
};

const setPassword = async () => {
  if (!validatePasswordForm()) return;
  
  try {
    saving.value = true;
    clearMessage();
    
    let response;
    
    // Usa l'API corretta in base al tipo di utente
    if (isUser.value) {
      response = await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/password`,
        {
          newPassword: credentialsForm.value.newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${userStore.token}`
          }
        }
      );
    } else if (isEnte.value) {
      const result = await updateEntePassword(userStore.token, credentialsForm.value.newPassword);
      response = { data: result };
    } else {
      showMessage('Tipo utente non supportato per la modifica della password', 'error');
      return;
    }
    
    showMessage('Password impostata con successo!');
    credentialsForm.value.newPassword = '';
    credentialsForm.value.confirmPassword = '';
    
    // Aggiorna l'utente con i dati ricevuti dal server
    if (response.data.data || response.data) {
      const userData = response.data.data || response.data;
      userStore.setUser(userData);
    } else {
      // Fallback: ricarica i dati utente
      await loadUserData();
    }
    
    // Torna alla sezione credenziali se era in setup
    if (activeSection.value === 'setup-password') {
      activeSection.value = 'credenziali';
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Errore durante l\'impostazione della password';
    showMessage(errorMessage, 'error');
  } finally {
    saving.value = false;
  }
};

// Inizializza Google Sign-In
const initializeGoogleSignIn = async (): Promise<void> => {
  if (googleInitialized) return;
  
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
      callback: handleGoogleConnectResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
      itp_support: true
    });

    // Renderizza nei container disponibili
    const settingsContainer = document.getElementById('google-signin-settings');
    const initialContainer = document.getElementById('google-signin-settings-initial');
    
    if (settingsContainer) {
      // @ts-ignore
      google.accounts.id.renderButton(settingsContainer, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        logo_alignment: 'left',
        width: '100%'
      });
    }
    
    if (initialContainer) {
      // @ts-ignore
      google.accounts.id.renderButton(initialContainer, {
        theme: 'filled_blue',
        size: 'large',
        shape: 'pill',
        logo_alignment: 'left',
        text: 'signin_with',
        width: '100%'
      });
    }
    
    googleInitialized = true;
  } catch (error) {
    console.error('Errore inizializzazione Google:', error);
  }
};

const handleGoogleConnectResponse = async (response: any) => {
  try {
    saving.value = true;
    clearMessage();
    
    const result = await linkGoogleAccount(response.credential, userStore.token);
    
    if (result.user) {
      userStore.setUser(result.user);
      showMessage('Account Google collegato con successo!');
      
      // Reset Google initialization per permettere re-rendering se necessario
      googleInitialized = false;
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Errore nel collegamento dell\'account Google';
    showMessage(errorMessage, 'error');
  } finally {
    saving.value = false;
  }
};

// Funzione per ottenere il label della categoria
const getCategoryLabel = (categoria: string): string => {
  const categories: Record<string, string> = {
    cultura: '🎭 Cultura',
    concerti: '🎵 Concerti',
    mostreInstallazioni: '🖼️ Mostre e installazioni',
    sport: '⚽ Sport',
    workshopCorsi: '📚 Workshop e corsi',
    conferenze: '🎤 Conferenze'
  };
  return categories[categoria] || categoria;
};

const loadUserData = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/me`,
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    );
    
    if (response.data.data) {
      userStore.setUser(response.data.data);
    }
  } catch (error) {
    console.error('Errore nel caricamento dati utente:', error);
  }
};

/**
 * Conferma ed esegue l'eliminazione definitiva dell'account
 * Questa funzione mostra un modal di conferma e procede con l'eliminazione
 */
const confermaEliminaAccount = async () => {
  const accountType = isEnte.value ? 'ente' : 'account utente';
  const result = await showConfirm(
    `⚠️ ATTENZIONE: Stai per eliminare definitivamente il tuo ${accountType}!\n\n` +
    `Questa azione cancellerà PERMANENTEMENTE:\n` +
    `• Il tuo profilo ${isEnte.value ? 'ente' : 'utente'}\n` +
    `• Tutte le tue proposte\n` +
    `• Tutti i tuoi commenti\n` +
    `• Tutti i dati associati al tuo ${accountType}\n\n` +
    `Questa operazione NON può essere annullata.\n\n` +
    `Sei assolutamente sicuro di voler procedere?`,
    'Conferma eliminazione account',
    '🗑️ SÌ, ELIMINA TUTTO',
    'Annulla'
  );
  
  if (!result) return;
  
  try {
    saving.value = true;
    clearMessage();
    
    // Chiamata API per eliminare l'account
    await deleteAccount(userStore.token);
    
    // Mostra messaggio di successo
    const accountType = isEnte.value ? 'Ente' : 'Account';
    await showSuccess(
      `${accountType} eliminato con successo. Verrai disconnesso automaticamente.`,
      `${accountType} eliminato`
    );
    
    // Logout automatico e redirect
    userStore.logout();
    router.push('/');
    
  } catch (error: any) {
    console.error('Errore eliminazione account:', error);
    const errorMessage = error.message || 'Errore durante l\'eliminazione dell\'account';
    
    await showError(
      'Non è stato possibile eliminare l\'account.',
      `Dettagli tecnici: ${errorMessage}`,
      'Errore eliminazione account'
    );
  } finally {
    saving.value = false;
  }
};

//badge per lo stato delle proposte
const getStatoBadge = (proposta: IProposta) => {
  const stato = proposta.stato?.stato || 'in_approvazione';
  
  switch (stato) {
    case 'approvata':
      return {
        text: 'Approvata',
        class: 'status-approved',
        icon: '✅'
      };
    case 'rifiutata':
      return {
        text: 'Rifiutata',
        class: 'status-rejected',
        icon: '❌'
      };
    case 'in_approvazione':
    default:
      return {
        text: 'In attesa',
        class: 'status-pending',
        icon: '⏳'
      };
  }
};

// Badge per il tipo di utente
const getUserTypeClass = (): string => {
  if (isEnte.value) return 'type-ente';
  if (isUser.value) return 'type-user';
  return 'type-user'; // fallback
};

const getUserTypeLabel = (): string => {
  if (isEnte.value) return 'ENTE';
  if (isUser.value) return 'UTENTE PRIVATO';
  return 'UTENTE'; // fallback
};
</script>

<template>
  <div class="profile-container">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Caricamento profilo...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
    </div>

    <!-- Profilo caricato -->
    <div v-else>
      <!-- Sezione profilo utente -->
      <div class="profile-header">
        <div class="profile-avatar-container">
          <img
            v-if="fotoProfiloUrl"
            class="profile-avatar"
            :src="fotoProfiloUrl"
            alt="Foto profilo"
          />
          <div v-else class="profile-avatar-placeholder">
            <span>{{ nomeCompleto.charAt(0).toUpperCase() }}</span>
          </div>
        </div>
        <div class="profile-info">
          <div class="profile-header-top">
            <div class="profile-name-section">
              <h1 class="profile-name">{{ nomeCompleto }}</h1>
              <span class="user-type-badge" :class="getUserTypeClass()">{{ getUserTypeLabel() }}</span>
            </div>
            <button 
              v-if="canModifyProfile" 
              class="settings-button" 
              @click="goToSettings" 
              title="Impostazioni"
            >
              <span class="settings-emoji">⚙️</span>
              <span class="settings-text">Impostazioni</span>
            </button>
          </div>
          <p class="profile-bio">
            {{ biografiaUtente }}
          </p>
          <div class="profile-stats">
            <div class="stat">
              <span class="stat-number">{{ mieProposte.length }}</span>
              <span class="stat-label">Proposte</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ hypedProposte.length }}</span>
              <span class="stat-label">Hyped</span>
            </div>
          </div>

        </div>
      </div>

      <!-- Tabs -->
      <div class="profile-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="{ active: selectedTab === tab.value }"
          @click="selectedTab = tab.value"
          class="tab-button"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Contenuto tab -->
      <div class="profile-content">


        <!-- Mie proposte -->
        <div v-if="selectedTab === 'mie'" class="proposals-section">
          <div v-if="mieProposte.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>Nessuna proposta ancora</h3>
            <p>Le tue proposte appariranno qui una volta pubblicate</p>
          </div>
          <div v-else class="proposals-grid">
            <div v-for="proposta in mieProposte" :key="proposta._id" class="proposal-card" @click="$router.push(`/proposte/${proposta._id}`)" style="cursor: pointer;">
              <div class="proposal-image-container">
                <img 
                  v-if="proposta.foto?.data"
                  :src="`data:${proposta.foto.contentType};base64,${proposta.foto.data}`"
                  class="proposal-image"
                  alt="Immagine proposta" 
                />
                <div v-else class="proposal-image-placeholder">
                  <span>📸</span>
                </div>
              </div>
              <div class="proposal-content">
                <div class="proposal-header">
                  <span class="proposal-hype">
                    <span class="hype-icon">⚡</span>
                    {{ proposta.listaHyper.length }}
                  </span>
                  <span :class="['status-badge', getStatoBadge(proposta).class]">{{ getStatoBadge(proposta).icon }} {{ getStatoBadge(proposta).text }}</span>
                  <span class="proposal-category">{{ getCategoryLabel(proposta.categoria || '') || 'Generale' }}</span>

                </div>
                <h3 class="proposal-title">{{ proposta.titolo }}</h3>
                <p class="proposal-description">{{ proposta.descrizione }}</p>
                <div class="proposal-footer">
                  <span class="proposal-date">
                    {{ new Date(proposta.createdAt).toLocaleDateString('it-IT') }}
                  </span>
                  <button class="action-button delete-button" @click.stop="rimuoviProposta(proposta)">
                    🗑️ Rimuovi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hyped -->
        <div v-else-if="selectedTab === 'hyped'" class="proposals-section">
          <div v-if="hypedProposte.length === 0" class="empty-state">
            <div class="empty-icon">⚡</div>
            <h3>Nessuna proposta hypata</h3>
            <p>Le proposte che hai hypato appariranno qui</p>
          </div>
          <div v-else class="proposals-grid">
            <div v-for="proposta in hypedProposte" :key="proposta._id" class="proposal-card" @click="$router.push(`/proposte/${proposta._id}`)" style="cursor: pointer;">
              <div class="proposal-image-container">
                <img 
                  v-if="proposta.foto?.data"
                  :src="`data:${proposta.foto.contentType};base64,${proposta.foto.data}`"
                  class="proposal-image"
                  alt="Immagine proposta" 
                />
                <div v-else class="proposal-image-placeholder">
                  <span>📸</span>
                </div>
              </div>
              <div class="proposal-content">
                <div class="proposal-header">
                  <span class="proposal-hype">
                    <span class="hype-icon">⚡</span>
                    {{ proposta.listaHyper.length }}
                  </span>
                  <span class="proposal-category">{{ getCategoryLabel(proposta.categoria || '') || 'Generale' }}</span>
                </div>
                <h3 class="proposal-title">{{ proposta.titolo }}</h3>
                <p class="proposal-description">{{ proposta.descrizione }}</p>
                <div class="proposal-footer">
                  <span class="proposal-date">
                    {{ new Date(proposta.createdAt).toLocaleDateString('it-IT') }}
                  </span>
                  <button class="action-button unhype-button" @click.stop="unhypeProposta(proposta)">
                    ⚡ Unhype
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Seguiti -->
        <div v-else-if="selectedTab === 'seguiti'" class="proposals-section">
          <!-- Loading state -->
          <div v-if="loadingSeguiti" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Caricamento utenti seguiti...</p>
          </div>

          <!-- Empty state -->
          <div v-else-if="utentiSeguiti.length === 0" class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>Nessun utente seguito</h3>
            <p>Gli utenti che seguirai appariranno qui</p>
          </div>

          <!-- Lista utenti seguiti -->
          <div v-else class="users-grid">
            <div v-for="utente in utentiSeguiti" :key="utente._id" class="user-card">
              <div class="user-avatar-container">
                <img 
                  v-if="utente.fotoProfilo?.data"
                  :src="`data:${utente.fotoProfilo.contentType};base64,${utente.fotoProfilo.data}`"
                  class="user-avatar"
                  :alt="`Avatar di ${utente.nome}`"
                />
                <div v-else class="user-avatar-placeholder">
                  <span>👤</span>
                </div>
              </div>
              
              <div class="user-info">
                <h4 class="user-name">
                  {{ utente.nome }}{{ utente.cognome ? ` ${utente.cognome}` : '' }}
                </h4>
                <p v-if="utente.biografia" class="user-bio">{{ utente.biografia }}</p>
                <p v-else class="user-bio-placeholder">Nessuna biografia</p>
                
                <div class="user-actions">
                  <button 
                    class="action-button unfollow-button" 
                    @click="smettereSeguitoUtente(utente)"
                    title="Smetti di seguire"
                  >
                    👋 Non seguire più
                  </button>
                  <button 
                    class="action-button view-profile-button" 
                    @click="$router.push(`/utenti/${utente._id}`)"
                    title="Visualizza profilo"
                  >
                    👁️ Vedi profilo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Impostazioni -->
  <div v-if="showSettingsModal" class="modal-overlay" @click="closeSettingsModal">
    <div class="modal-content settings-modal" @click.stop>
      <div class="modal-header">
        <h3>⚙️ Impostazioni</h3>
        <button @click="closeSettingsModal" class="close-btn">×</button>
      </div>

      <!-- Messaggi -->
      <div v-if="message.text" :class="['message', message.type]">
        <span class="message-icon">{{ message.type === 'error' ? '⚠️' : '✅' }}</span>
        {{ message.text }}
      </div>

      <div class="modal-body">
        <!-- Toggle per scegliere la sezione -->
        <div class="toggle-container">
          <div class="toggle-switch">
            <div class="toggle-slider" :class="{ 'slide-right': activeSection === 'credenziali' }"></div>
            <button
              class="toggle-option"
              :class="{ active: activeSection === 'profilo' }"
              @click="setActiveSection('profilo')"
            >
              Profilo
            </button>
            <button
              class="toggle-option"
              :class="{ active: activeSection === 'credenziali' }"
              @click="setActiveSection('credenziali')"
            >
              Credenziali
            </button>
          </div>
        </div>
        <!-- Sezione Profilo -->
        <div v-if="activeSection === 'profilo'" class="section">
          <form @submit.prevent="saveProfileChanges" class="profile-form">
            <!-- Foto profilo -->
            <div class="form-group photo-group">
              <label class="form-label">Foto profilo</label>
              <div class="photo-container">
                <div class="current-photo">
                  <img
                    v-if="fotoProfiloUrl"
                    :src="fotoProfiloUrl"
                    alt="Foto profilo attuale"
                    class="profile-photo"
                  />
                  <div v-else class="photo-placeholder">
                    <span>{{ (profileForm.nome[0] || '?').toUpperCase() }}</span>
                  </div>
                </div>
                <div class="photo-actions">
                  <button type="button" @click="triggerFileUpload" class="photo-button">
                    📷 Cambia foto
                  </button>
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    @change="handleFileUpload"
                    style="display: none"
                  />
                </div>
              </div>
            </div>

            <!-- Nome -->
            <div class="form-group">
              <label for="nome" class="form-label">Nome *</label>
              <input
                id="nome"
                v-model="profileForm.nome"
                type="text"
                class="form-input"
                required
              />
            </div>

            <!-- Cognome (solo per User) -->
            <div v-if="isUser" class="form-group">
              <label for="cognome" class="form-label">Cognome *</label>
              <input
                id="cognome"
                v-model="profileForm.cognome"
                type="text"
                class="form-input"
                required
              />
            </div>

            <!-- Email (read-only) -->
            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <div class="readonly-field-container">
                <input
                  id="email"
                  :value="userStore.user?.credenziali?.email || 'Email non disponibile'"
                  type="email"
                  class="form-input readonly-input"
                  readonly
                  title="L'email non può essere modificata"
                />
                <span class="readonly-icon">🔒</span>
              </div>
            </div>

            <!-- Codice Fiscale (read-only) -->
            <div class="form-group">
              <label for="codiceFiscale" class="form-label">
                {{ isEnte ? 'Codice Fiscale / P.IVA' : 'Codice Fiscale' }}
              </label>
              <div class="readonly-field-container">
                <input
                  id="codiceFiscale"
                  :value="userStore.user?.codiceFiscale || 'Non disponibile'"
                  type="text"
                  class="form-input readonly-input"
                  readonly
                  :title="isEnte ? 'Il codice fiscale/P.IVA non può essere modificato' : 'Il codice fiscale non può essere modificato'"
                />
                <span class="readonly-icon">🔒</span>
              </div>
            </div>

            <!-- Biografia -->
            <div class="form-group">
              <label for="biografia" class="form-label">Biografia</label>
              <textarea
                id="biografia"
                v-model="profileForm.biografia"
                class="form-textarea"
                rows="3"
                placeholder="Racconta qualcosa di te..."
                maxlength="500"
              ></textarea>
              <div class="char-count">{{ profileForm.biografia.length }}/500</div>
            </div>

            <button
              type="submit"
              :disabled="saving"
              class="save-button"
            >
              <span v-if="saving">🔄 Salvando...</span>
              <span v-else>💾 Salva modifiche</span>
            </button>
          </form>
        </div>

        <!-- Sezione Credenziali -->
        <div v-if="activeSection === 'credenziali'" class="section">
          <!-- Suggerimenti intelligenti - sempre in cima -->
          <div v-if="!hasLocalAuth && !hasGoogleAuth" class="auth-suggestion danger">
            <div class="suggestion-content">
              <div class="suggestion-icon">⚠️</div>
              <div class="suggestion-text">
                <h4>Configura il tuo accesso</h4>
                <p>Per la sicurezza del tuo account, imposta almeno un metodo di accesso.</p>
              </div>
            </div>
          </div>

          <div v-else-if="(!hasLocalAuth || !hasGoogleAuth) && hasLocalAuth" class="auth-suggestion info">
            <div class="suggestion-content">
              <div class="suggestion-icon">💡</div>
              <div class="suggestion-text">
                <h4>Accesso più veloce</h4>
                <p>Collega Google per accedere rapidamente senza digitare la password.</p>
              </div>
            </div>
          </div>

          <div v-else-if="(!hasLocalAuth || !hasGoogleAuth) && hasGoogleAuth" class="auth-suggestion info">
            <div class="suggestion-content">
              <div class="suggestion-icon">💡</div>
              <div class="suggestion-text">
                <h4>Backup della sicurezza</h4>
                <p>Aggiungi una password per accedere anche se Google non è disponibile.</p>
              </div>
            </div>
          </div>

          <div v-else class="auth-suggestion success">
            <div class="suggestion-content">
              <div class="suggestion-icon">🎉</div>
              <div class="suggestion-text">
                <h4>Account completamente protetto</h4>
                <p>Hai configurato entrambi i metodi di accesso.</p>
              </div>
            </div>
          </div>

          <!-- Stato autenticazioni -->
          <div class="auth-status">
            <div class="auth-method">
              <div class="auth-info">
                <h4>🔑 Password locale</h4>
                <p v-if="hasLocalAuth" class="auth-active">Configurata e pronta all'uso</p>
                <p v-else class="auth-missing">Non impostata</p>
              </div>
              <div class="auth-status-indicator">
                <span v-if="hasLocalAuth" class="status-active">✅</span>
                <span v-else class="status-inactive">❌</span>
              </div>
            </div>

            <div class="auth-method">
              <div class="auth-info">
                <h4>🔗 Account Google</h4>
                <p v-if="hasGoogleAuth" class="auth-active">Collegato e attivo</p>
                <p v-else class="auth-missing">Non collegato</p>
              </div>
              <div class="auth-status-indicator">
                <span v-if="hasGoogleAuth" class="status-active">✅</span>
                <span v-else class="status-inactive">❌</span>
              </div>
            </div>
          </div>

          <!-- Imposta password -->
          <div v-if="hasGoogleAuth && !hasLocalAuth" class="credentials-form">
            <div class="form-header">
              <h4>🔑 Imposta una password</h4>
              <p>Crea una password per accedere anche senza Google</p>
            </div>

            <form @submit.prevent="setPassword">
              <div class="form-group">
                <label for="newPassword" class="form-label">Nuova password *</label>
                <input
                  id="newPassword"
                  v-model="credentialsForm.newPassword"
                  type="password"
                  class="form-input"
                  :placeholder="securityControlsEnabled ? 'Minimo 8 caratteri con maiuscole, minuscole, numeri e simboli' : 'Minimo 6 caratteri'"
                  required
                />
                
                <!-- Indicatori sicurezza password (solo se controlli abilitati) -->
                <div v-if="credentialsForm.newPassword && securityControlsEnabled" class="password-strength">
                  <div class="strength-bar">
                    <div class="strength-fill" :class="passwordValidation?.strength" :style="{ width: passwordValidation?.percentage + '%' }"></div>
                  </div>
                  <p class="strength-text" :class="passwordValidation?.strength">
                    {{ passwordValidation?.strength === 'weak' ? 'Password debole' : 
                       passwordValidation?.strength === 'medium' ? 'Password media' : 
                       passwordValidation?.strength === 'good' ? 'Password buona' : 'Password sicura' }}
                  </p>
                </div>
                
                <!-- Requisiti password (solo se controlli abilitati) -->
                <div v-if="(credentialsForm.newPassword || passwordValidation?.errors.length) && securityControlsEnabled" class="password-requirements">
                  <p class="requirements-title">Requisiti password:</p>
                  <ul class="requirements-list">
                    <li :class="{ 'valid': passwordChecks?.length }">
                      <span class="icon">{{ passwordChecks?.length ? '✅' : '❌' }}</span>
                      Almeno 8 caratteri
                    </li>
                    <li :class="{ 'valid': passwordChecks?.lowercase }">
                      <span class="icon">{{ passwordChecks?.lowercase ? '✅' : '❌' }}</span>
                      Una lettera minuscola
                    </li>
                    <li :class="{ 'valid': passwordChecks?.uppercase }">
                      <span class="icon">{{ passwordChecks?.uppercase ? '✅' : '❌' }}</span>
                      Una lettera maiuscola
                    </li>
                    <li :class="{ 'valid': passwordChecks?.number }">
                      <span class="icon">{{ passwordChecks?.number ? '✅' : '❌' }}</span>
                      Un numero
                    </li>
                    <li :class="{ 'valid': passwordChecks?.special }">
                      <span class="icon">{{ passwordChecks?.special ? '✅' : '❌' }}</span>
                      Un carattere speciale (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              </div>

              <div class="form-group">
                <label for="confirmPassword" class="form-label">Conferma password *</label>
                <input
                  id="confirmPassword"
                  v-model="credentialsForm.confirmPassword"
                  type="password"
                  class="form-input"
                  placeholder="Ripeti la password"
                  required
                />
              </div>

              <button
                type="submit"
                :disabled="saving"
                class="save-button"
              >
                <span v-if="saving">🔄 Impostando...</span>
                <span v-else>🔑 Imposta password</span>
              </button>
            </form>
          </div>

          <!-- Collega Google -->
          <div v-if="hasLocalAuth && !hasGoogleAuth" class="credentials-form">
            <div class="form-header">
              <h4>🔗 Collega Google</h4>
              <p>Accedi più velocemente con il tuo account Google</p>
            </div>

            <div class="google-connect-container">
              <div id="google-signin-settings"></div>
            </div>
          </div>

          <!-- Configurazione iniziale -->
          <div v-if="!hasLocalAuth && !hasGoogleAuth" class="credentials-setup">
            <div class="setup-header">
              <h4>⚙️ Configura il tuo accesso</h4>
              <p>Scegli come vuoi accedere al tuo account</p>
            </div>
            
            <div class="setup-options">
              <div class="setup-option">
                <button 
                  type="button" 
                  class="setup-btn password-setup"
                  @click="activeSection = 'setup-password'"
                >
                  <span class="setup-icon">🔑</span>
                  <span class="setup-text">Crea una password</span>
                </button>
              </div>
              
              <div class="setup-divider">
                <span>oppure</span>
              </div>
              
              <div class="setup-option">
                <div class="google-option">
                  <div class="google-text">
                    <span class="setup-icon">🔗</span>
                    <span class="setup-text">Usa Google</span>
                  </div>
                  <div id="google-signin-settings-initial"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Zona pericolosa - Elimina Account (nascosta per operatori) -->
          <div v-if="!isOperatore" class="danger-zone">
            <div class="danger-header">
              <h4>🚨 Zona pericolosa</h4>
              <p>Azioni irreversibili che elimineranno definitivamente il tuo {{ isEnte ? 'ente' : 'account' }}</p>
            </div>
            
            <button 
              type="button" 
              class="delete-account-btn"
              @click="confermaEliminaAccount"
            >
              <span class="delete-icon">🗑️</span>
              <span class="delete-text">Elimina {{ isEnte ? 'ente' : 'account' }} definitivamente</span>
            </button>
          </div>
        </div>

        <!-- Sezione setup password iniziale -->
        <div v-if="activeSection === 'setup-password'" class="section">
          <div class="credentials-form priority">
            <h4>🔑 Crea la tua password</h4>
            <p>Imposta una password per il tuo account</p>

            <form @submit.prevent="setPassword">
              <div class="form-group">
                <label for="newPasswordSetup" class="form-label">Nuova password *</label>
                <input
                  id="newPasswordSetup"
                  v-model="credentialsForm.newPassword"
                  type="password"
                  class="form-input"
                  :placeholder="securityControlsEnabled ? 'Minimo 8 caratteri con maiuscole, minuscole, numeri e simboli' : 'Minimo 6 caratteri'"
                  required
                />
                
                <!-- Indicatori sicurezza password (solo se controlli abilitati) -->
                <div v-if="credentialsForm.newPassword && securityControlsEnabled" class="password-strength">
                  <div class="strength-bar">
                    <div class="strength-fill" :class="passwordValidation?.strength" :style="{ width: passwordValidation?.percentage + '%' }"></div>
                  </div>
                  <p class="strength-text" :class="passwordValidation?.strength">
                    {{ passwordValidation?.strength === 'weak' ? 'Password debole' : 
                       passwordValidation?.strength === 'medium' ? 'Password media' : 
                       passwordValidation?.strength === 'good' ? 'Password buona' : 'Password sicura' }}
                  </p>
                </div>
                
                <!-- Requisiti password (solo se controlli abilitati) -->
                <div v-if="(credentialsForm.newPassword || passwordValidation?.errors.length) && securityControlsEnabled" class="password-requirements">
                  <p class="requirements-title">Requisiti password:</p>
                  <ul class="requirements-list">
                    <li :class="{ 'valid': passwordChecks?.length }">
                      <span class="icon">{{ passwordChecks?.length ? '✅' : '❌' }}</span>
                      Almeno 8 caratteri
                    </li>
                    <li :class="{ 'valid': passwordChecks?.lowercase }">
                      <span class="icon">{{ passwordChecks?.lowercase ? '✅' : '❌' }}</span>
                      Una lettera minuscola
                    </li>
                    <li :class="{ 'valid': passwordChecks?.uppercase }">
                      <span class="icon">{{ passwordChecks?.uppercase ? '✅' : '❌' }}</span>
                      Una lettera maiuscola
                    </li>
                    <li :class="{ 'valid': passwordChecks?.number }">
                      <span class="icon">{{ passwordChecks?.number ? '✅' : '❌' }}</span>
                      Un numero
                    </li>
                    <li :class="{ 'valid': passwordChecks?.special }">
                      <span class="icon">{{ passwordChecks?.special ? '✅' : '❌' }}</span>
                      Un carattere speciale (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              </div>

              <div class="form-group">
                <label for="confirmPasswordSetup" class="form-label">Conferma password *</label>
                <input
                  id="confirmPasswordSetup"
                  v-model="credentialsForm.confirmPassword"
                  type="password"
                  class="form-input"
                  placeholder="Ripeti la password"
                  required
                />
              </div>

              <div class="form-actions">
                <button
                  type="button"
                  @click="setActiveSection('credenziali')"
                  class="cancel-button"
                >
                  ← Indietro
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="save-button"
                >
                  <span v-if="saving">🔄 Creando...</span>
                  <span v-else>🔑 Crea password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: var(--color-background-soft);
  padding-bottom: 80px;
}

/* Loading e Error States */
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.loading-container p, .error-container p {
  color: var(--color-text);
  margin: 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #fe4654;
  font-weight: 500;
}

/* Header del profilo */
.profile-header {
  background: var(--color-card-background);
  margin: 1rem 1.5rem 0.8rem 1.5rem;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 16px var(--color-shadow);
  display: flex;
  gap: 1.2rem;
  align-items: flex-start;
}

.profile-avatar-container {
  flex-shrink: 0;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fe4654;
}

.profile-avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fe4654;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
}

.profile-info {
  flex: 1;
}

.profile-header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.profile-name-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.user-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  animation: badgeAppear 0.5s ease-out;
}

@keyframes badgeAppear {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.user-type-badge.type-user {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #bbdefb;
}

.user-type-badge.type-ente {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
}

.settings-button {
  background: var(--color-card-background);
  color: var(--color-text);
  border: 2px solid var(--color-border);
  border-radius: 1.5rem;
  padding: 0.85rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.settings-button:hover {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--color-primary-light);
}

.settings-button:active {
  transform: translateY(0);
}

.settings-emoji {
  font-size: 1.1rem;
}

.settings-text {
  font-weight: 600;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
}

.profile-bio {
  color: var(--color-text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.profile-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fe4654;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-top: 0.2rem;
}

/* Tabs */
.profile-tabs {
  background: var(--color-card-background);
  border-radius: 1rem;
  margin: 0 1.5rem 1rem 1.5rem;
  padding: 0.4rem;
  display: flex;
  gap: 0.4rem;
  box-shadow: 0 2px 16px var(--color-shadow);
}

.tab-button {
  flex: 1;
  background: none;
  color: var(--color-text-secondary);
  border: none;
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  color: var(--color-text);
}

.tab-button.active {
  background: var(--color-primary);
  color: #fff;
}

/* Contenuto */
.profile-content {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.proposals-section {
  width: 100%;
}

.proposals-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--color-card-background);
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px var(--color-shadow);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #404149;
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--color-text-secondary);
  margin: 0;
}

/* Card proposte */
.proposal-card {
  background: var(--color-card-background);
  border-radius: 1.2rem;
  overflow: hidden;
  box-shadow: 0 2px 16px var(--color-shadow);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.proposal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px var(--color-shadow);
}

.proposal-image-container {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: #f8f7f3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.proposal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.proposal-image-placeholder {
  color: var(--color-text-secondary);
  font-size: 2rem;
}

.proposal-content {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.proposal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.proposal-hype {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--color-card-background);
  color: var(--color-primary);
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  border: 1px solid var(--color-primary-light);
}

.hype-icon {
  font-size: 1rem;
}

.proposal-category {
  background: var(--color-background-mute);
  color: var(--color-text);
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.proposal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
}

.proposal-description {
  color: var(--color-text);
  margin: 0 0 1rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.proposal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-top: auto;
}

/* Pulsanti azione */
.action-button {
  background: none;
  border: 1px solid;
  border-radius: 1rem;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.delete-button {
  color: #dc3545;
  border-color: #dc3545;
}

.delete-button:hover {
  background: #dc3545;
  color: #fff;
}

.unhype-button {
  color: #fe4654;
  border-color: #fe4654;
}

.unhype-button:hover {
  background: #fe4654;
  color: #fff;
}

.proposal-author {
  font-style: italic;
}

.proposal-date {
  font-weight: 500;
}





/* Responsive */
@media (min-width: 768px) {
  .proposals-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
  
  .profile-header {
    margin: 2rem 2rem 1.5rem 2rem;
  }
  
  .profile-tabs {
    margin: 0 2rem 2rem 2rem;
  }
  
  .profile-content {
    padding: 0 2rem 2rem 2rem;
  }
}

@media (min-width: 1024px) {
  .proposals-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}

@media (max-width: 767px) {
  .profile-header {
    margin: 1.5rem 1rem 1rem 1rem;
    padding: 1.5rem;
  }
  
  .profile-header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .profile-name-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .settings-button {
    align-self: center;
    font-size: 0.85rem;
    padding: 0.6rem 1rem;
  }
  
  .profile-tabs {
    margin: 0 1rem 1.5rem 1rem;
  }
  
  .profile-content {
    padding: 0 1rem 2rem 1rem;
  }
}

/* Modal Styles - Ispirato al design della UserList */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  max-width: 900px;  /* Aumentato da 700px */
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.settings-modal {
  color: #404149;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #404149;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #666;
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  max-height: calc(90vh - 100px);
}

/* Toggle Styles - Copiato dalla HomeView */
.toggle-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.toggle-switch {
  position: relative;
  display: flex;
  background: #e6e6e6;
  border-radius: 2rem;
  padding: 0.25rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 280px;
}

.toggle-slider {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: calc(50% - 0.25rem);
  height: calc(100% - 0.5rem);
  background: #fe4654;
  border-radius: 1.75rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

.toggle-slider.slide-right {
  transform: translateX(100%);
}

.toggle-option {
  position: relative;
  z-index: 2;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: #404149;
  font-size: 1rem;
  border-radius: 1.75rem;
  cursor: pointer;
  transition: color 0.3s ease;
  flex: 1;
  text-align: center;
  font-weight: 500;
}

.toggle-option.active {
  color: #fff;
  font-weight: bold;
}

/* Message styles */
.message {
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  border-bottom: 1px solid #e0e0e0;
}

.message.success {
  background: #d4edda;
  color: #155724;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
}

/* Form styles - Design dell'app */
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #404149;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}

.form-input,
.form-textarea {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 1rem;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
  background: #fff;
  color: #404149;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #fe4654;
  box-shadow: 0 0 0 3px rgba(254, 70, 84, 0.1);
}

.readonly-input {
  background: var(--color-background-mute) !important;
  color: var(--color-text-secondary) !important;
  cursor: not-allowed;
}

.readonly-field-container {
  position: relative;
  display: flex;
  align-items: center;
}

.readonly-field-container .form-input {
  flex: 1;
  padding-right: 3rem;
}

.readonly-icon {
  position: absolute;
  right: 1rem;
  font-size: 1.1rem;
  color: #666;
  pointer-events: none;
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

/* Password validation styles */
.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-fill.weak {
  background: #ef4444;
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
  color: #ef4444;
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

.password-requirements {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.requirements-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.requirements-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.requirements-list li {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: #6b7280;
  transition: color 0.2s ease;
}

.requirements-list li.valid {
  color: #10b981;
}

.requirements-list li .icon {
  margin-right: 0.5rem;
  font-size: 0.75rem;
}

/* Photo group styles */
.photo-group {
  align-items: flex-start;
}

.photo-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.current-photo {
  flex-shrink: 0;
}

.current-photo .profile-photo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fe4654;
}

.photo-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fe4654;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: white;
}

.photo-button {
  padding: 0.6rem 1.2rem;
  border: 2px solid #fe4654;
  border-radius: 1rem;
  background: white;
  color: #fe4654;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.photo-button:hover {
  background: #fe4654;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(254, 70, 84, 0.3);
}

/* Auth status styles */
.auth-status {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.auth-method {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  border: 2px solid #e0e0e0;
  border-radius: 1rem;
  background: #f8f7f3;
}

.auth-info h4 {
  margin: 0 0 0.25rem 0;
  color: #404149;
  font-size: 1rem;
  font-weight: 600;
}

.auth-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.missing-auth {
  color: #dc3545 !important;
  font-weight: 500;
}

.status-active {
  color: #28a745;
  font-weight: 600;
  font-size: 0.9rem;
}

.status-inactive {
  color: #dc3545;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Auth suggestion styles */
.auth-suggestion {
  border-radius: 1rem;
  margin-bottom: 2rem;
  border: 2px solid;
  overflow: hidden;
}

.suggestion-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem;
}

.auth-suggestion.danger {
  background: linear-gradient(135deg, #fee, #fdd);
  border-color: #dc3545;
}

.auth-suggestion.info {
  background: linear-gradient(135deg, #e7f3ff, #d1ecf1);
  border-color: #0066cc;
}

.auth-suggestion.success {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border-color: #28a745;
}

.suggestion-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.suggestion-text h4 {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  font-size: 1rem;
  color: #404149;
}

.suggestion-text p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #666;
}

/* Auth status styles */
.auth-method {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.2rem;
  border: 2px solid #e0e0e0;
  border-radius: 1rem;
  background: #fafafa;
  transition: all 0.2s ease;
}

.auth-method:hover {
  border-color: #d0d0d0;
  background: #f5f5f5;
}

.auth-info h4 {
  margin: 0 0 0.3rem 0;
  color: #404149;
  font-size: 1rem;
  font-weight: 600;
}

.auth-info p {
  margin: 0;
  font-size: 0.9rem;
}

.auth-active {
  color: #28a745 !important;
  font-weight: 500;
}

.auth-missing {
  color: #dc3545 !important;
  font-weight: 500;
}

.status-active, .status-inactive {
  font-size: 1.2rem;
}

/* Credentials form styles */
.credentials-form {
  background: #f8f7f3;
  padding: 1.5rem;
  border-radius: 1rem;
  border: 2px solid #e0e0e0;
  margin-bottom: 1.5rem;
}

.form-header {
  margin-bottom: 1.5rem;
}

.form-header h4 {
  margin: 0 0 0.5rem 0;
  color: #404149;
  font-weight: 600;
  font-size: 1.1rem;
}

.form-header p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.google-connect-container {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

/* Credentials complete styles */
.credentials-complete {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border: 2px solid #28a745;
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.complete-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

.complete-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.complete-text h4 {
  margin: 0 0 0.5rem 0;
  color: #155724;
  font-weight: 600;
  font-size: 1.1rem;
}

.complete-text p {
  margin: 0;
  color: #155724;
  font-size: 0.9rem;
}

/* Setup styles */
.credentials-setup {
  background: #fff5f5;
  border: 2px solid #fe4654;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.setup-header {
  text-align: center;
  margin-bottom: 2rem;
}

.setup-header h4 {
  margin: 0 0 0.5rem 0;
  color: #404149;
  font-weight: 600;
  font-size: 1.1rem;
}

.setup-header p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.setup-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.setup-option {
  width: 100%;
  max-width: 300px;
}

.setup-btn {
  width: 100%;
  padding: 1rem;
  border: 2px solid #fe4654;
  border-radius: 1rem;
  background: white;
  color: #fe4654;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.setup-btn:hover {
  background: #fe4654;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(254, 70, 84, 0.3);
}

.setup-icon {
  font-size: 1.2rem;
}

.setup-divider {
  text-align: center;
  color: #666;
  font-weight: 500;
  margin: 0.5rem 0;
  position: relative;
}

.setup-divider::before,
.setup-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40px;
  height: 1px;
  background: #ddd;
}

.setup-divider::before {
  left: -50px;
}

.setup-divider::after {
  right: -50px;
}

.google-option {
  width: 100%;
  text-align: center;
}

.google-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #666;
  font-weight: 500;
}

#google-signin-settings,
#google-signin-settings-initial {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 44px;
}
.credentials-form {
  background: #f8f7f3;
  padding: 1.5rem;
  border-radius: 1rem;
  border: 2px solid #e0e0e0;
}

.credentials-form h4 {
  margin: 0 0 0.5rem 0;
  color: #404149;
  font-weight: 600;
}

.credentials-form p {
  margin: 0 0 1.5rem 0;
  color: #666;
}

.credentials-complete {
  text-align: center;
  padding: 2rem;
  background: #f8f7f3;
  border-radius: 1rem;
  border: 2px solid #e0e0e0;
}

.success-message {
  font-size: 1.1rem;
  font-weight: 600;
  color: #28a745;
  margin-bottom: 0.5rem;
}

.google-signin-container {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

/* Button styles */
.save-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 1rem;
  background: linear-gradient(135deg, #fe4654, #404149);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(254, 70, 84, 0.4);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-button {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 1rem;
  background: white;
  color: #666;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  border-color: #ccc;
  color: #404149;
  transform: translateY(-1px);
}

.form-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 1.5rem;
}

.form-actions .save-button {
  flex: 1;
  margin-top: 0;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive modal */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem 1.5rem;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .photo-container {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .auth-method {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .toggle-switch {
    width: 100%;
    max-width: 280px;
  }

  .toggle-option {
    flex: 1;
    min-width: auto;
    font-size: 0.9rem;
  }
}

/* Badge stato proposta */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  background:var(--color-background-mute);
}

.status-approved {
  color: #155724;
}

.status-rejected {
  color: #721c24;
}

.status-pending {
  color: #856404;
}

/* Zona pericolosa - Elimina Account */
.danger-zone {
  background: linear-gradient(135deg, #fff5f5, #ffe6e6);
  border: 2px solid #dc3545;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-top: 2rem;
}

.danger-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.danger-header h4 {
  margin: 0 0 0.5rem 0;
  color: #721c24;
  font-weight: 700;
  font-size: 1.1rem;
}

.danger-header p {
  margin: 0;
  color: #721c24;
  font-size: 0.9rem;
  opacity: 0.8;
}

.delete-account-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  border: 2px solid #dc3545;
  border-radius: 1rem;
  background: #fff;
  color: #dc3545;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.2);
}

.delete-account-btn:hover {
  background: #dc3545;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
}

.delete-account-btn:active {
  transform: translateY(0);
}

.delete-icon {
  font-size: 1.2rem;
}

.delete-text {
  font-weight: 700;
}

/* Stili per la sezione utenti seguiti */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

.user-card {
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.user-avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.user-avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.user-info {
  text-align: center;
}

.user-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.user-bio {
  color: #4a5568;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.user-bio-placeholder {
  color: #a0aec0;
  font-size: 0.9rem;
  font-style: italic;
  margin: 0 0 1.5rem 0;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.unfollow-button {
  background: linear-gradient(135deg, #fd746c 0%, #ff9068 100%);
  color: #fff;
  border: none;
  font-weight: 600;
}

.unfollow-button:hover {
  background: linear-gradient(135deg, #fc5c54 0%, #fe7f5c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(253, 116, 108, 0.4);
}

.view-profile-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  font-weight: 600;
}

.view-profile-button:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #4a5568;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive per la griglia utenti */
@media (max-width: 768px) {
  .users-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .user-card {
    padding: 1rem;
  }
  
  .user-avatar,
  .user-avatar-placeholder {
    width: 60px;
    height: 60px;
  }
  
  .user-avatar-placeholder {
    font-size: 1.5rem;
  }
}
</style>