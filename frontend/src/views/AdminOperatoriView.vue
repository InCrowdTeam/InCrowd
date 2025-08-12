<template>
  <div class="admin-container">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Caricamento operatori...</p>
    </div>

    <!-- Admin panel -->
    <div v-else>
      <!-- Header -->
      <div class="admin-header">
        <div class="admin-info">
          <h1 class="admin-title">Gestione Operatori</h1>
          <p class="admin-subtitle">Amministra gli operatori del sistema</p>
          <div class="admin-stats">
            <div class="stat">
              <span class="stat-number">{{ operatori.length }}</span>
              <span class="stat-label">Operatori attivi</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Form aggiunta operatore -->
      <div class="form-section">
        <h2>Aggiungi Nuovo Operatore</h2>
        <form @submit.prevent="create" class="operator-form">
          <div class="form-row">
            <div class="form-group">
              <label for="nome">Nome <span class="required-asterisk">*</span></label>
              <input 
                id="nome"
                v-model="form.nome" 
                type="text"
                placeholder="Nome operatore" 
                :class="{ 'error': showErrors && !form.nome.trim() }"
                required 
              />
              <div v-if="showErrors && !form.nome.trim()" class="field-error">
                Il nome è obbligatorio
              </div>
            </div>
            <div class="form-group">
              <label for="cognome">Cognome <span class="required-asterisk">*</span></label>
              <input 
                id="cognome"
                v-model="form.cognome" 
                type="text"
                placeholder="Cognome operatore" 
                :class="{ 'error': showErrors && !form.cognome.trim() }"
                required 
              />
              <div v-if="showErrors && !form.cognome.trim()" class="field-error">
                Il cognome è obbligatorio
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="email">Email <span class="required-asterisk">*</span></label>
              <input 
                id="email"
                v-model="form.email" 
                type="email"
                placeholder="email@esempio.com" 
                :class="{ 'error': showErrors && (!form.email.trim() || !isValidEmail) }"
                required 
                @blur="validateEmail"
              />
              <div v-if="showErrors && !form.email.trim()" class="field-error">
                L'email è obbligatoria
              </div>
              <div v-else-if="showErrors && form.email.trim() && !isValidEmail" class="field-error">
                Formato email non valido
              </div>
            </div>
            <div class="form-group">
              <label for="password">Password <span class="required-asterisk">*</span></label>
              <input 
                id="password"
                v-model="form.password" 
                type="password"
                placeholder="Password sicura" 
                :class="{ 'error': showErrors && (!form.password || !isValidPassword) }"
                required 
                @input="validatePassword"
              />
              
              <!-- Indicatori sicurezza password -->
              <div v-if="form.password && securityControlsEnabled" class="password-strength">
                <div class="strength-bar">
                  <div class="strength-fill" :class="passwordStrengthClass" :style="{ width: passwordStrengthPercentage + '%' }"></div>
                </div>
                <p class="strength-text" :class="passwordStrengthClass">
                  {{ passwordStrengthText }}
                </p>
              </div>
              
              <!-- Requisiti password -->
              <div v-if="(form.password || showErrors) && securityControlsEnabled" class="password-requirements">
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
              
              <div v-if="showErrors && !form.password" class="field-error">
                La password è obbligatoria
              </div>
              <div v-else-if="showErrors && form.password && !isValidPassword" class="field-error">
                La password non soddisfa i requisiti di sicurezza
              </div>
            </div>
          </div>
          <button type="submit" class="add-button" :disabled="submitting">
            {{ submitting ? 'Aggiunta...' : '➕ Aggiungi Operatore' }}
          </button>
        </form>
        
        <!-- Messaggi di errore/successo -->
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
      </div>

      <!-- Lista operatori -->
      <div class="operators-section">
        <h2>Operatori Attivi</h2>
        
        <!-- Empty state -->
        <div v-if="operatori.length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>Nessun operatore</h3>
          <p>Aggiungi il primo operatore utilizzando il form sopra</p>
        </div>

        <!-- Lista operatori -->
        <div v-else class="operators-grid">
          <div v-for="op in operatori" :key="op._id" class="operator-card">
            <div class="operator-avatar">
              <span>{{ op.nome.charAt(0).toUpperCase() }}{{ op.cognome.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="operator-info">
              <h3 class="operator-name">{{ op.nome }} {{ op.cognome }}</h3>
              <p class="operator-email">{{ op.credenziali.email }}</p>
              <p class="operator-role">Operatore</p>
            </div>
            <button @click="confirmRemove(op)" class="remove-button">
              🗑️ Rimuovi
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { getAllOperatori, createOperatoreAdmin, deleteOperatore } from '@/api/operatoreApi'
import { useModal } from '@/composables/useModal'

const operatori = ref<any[]>([])
const form = ref({ nome: '', cognome: '', email: '', password: '' })
const store = useUserStore()
const { showConfirm, showError } = useModal()

// Stati UI
const loading = ref(true)
const submitting = ref(false)
const showErrors = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Computed
const securityControlsEnabled = computed(() => {
  return import.meta.env.VITE_ENABLE_SECURITY_CONTROLS === 'true'
})

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(form.value.email)
})

const passwordChecks = computed(() => {
  const password = form.value.password || ''
  return {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
})

const isValidPassword = computed(() => {
  if (!securityControlsEnabled.value) {
    return form.value.password && form.value.password.length >= 6
  }
  
  const checks = passwordChecks.value
  return checks.length && checks.lowercase && checks.uppercase && checks.number && checks.special
})

const passwordStrengthScore = computed(() => {
  const checks = passwordChecks.value
  let score = 0
  if (checks.length) score++
  if (checks.lowercase) score++
  if (checks.uppercase) score++
  if (checks.number) score++
  if (checks.special) score++
  return score
})

const passwordStrengthPercentage = computed(() => {
  return (passwordStrengthScore.value / 5) * 100
})

const passwordStrengthClass = computed(() => {
  const score = passwordStrengthScore.value
  if (score <= 2) return 'weak'
  if (score <= 3) return 'medium'
  if (score <= 4) return 'good'
  return 'strong'
})

const passwordStrengthText = computed(() => {
  const score = passwordStrengthScore.value
  if (score <= 2) return 'Password debole'
  if (score <= 3) return 'Password media'
  if (score <= 4) return 'Password buona'
  return 'Password sicura'
})

// Metodi di validazione
const validateEmail = () => {
  if (!showErrors.value && form.value.email) {
    showErrors.value = true
  }
}

const validatePassword = () => {
  if (!showErrors.value && form.value.password) {
    showErrors.value = true
  }
}

const fetchOperatori = async () => {
  try {
    loading.value = true
    const data = await getAllOperatori(store.token)
    operatori.value = data
  } catch (err: any) {
    errorMessage.value = err.message || 'Errore nel caricamento degli operatori'
    showError(
      'Errore nel caricamento degli operatori',
      err.message || undefined,
      'Errore'
    )
  } finally {
    loading.value = false
  }
}

const create = async () => {
  try {
    submitting.value = true
    errorMessage.value = ''
    successMessage.value = ''
    showErrors.value = true
    
    // Validazione dei campi obbligatori
    if (!form.value.nome || !form.value.cognome || !form.value.email || !form.value.password) {
      errorMessage.value = 'Tutti i campi sono obbligatori'
      return
    }
    
    // Validazione email
    if (!isValidEmail.value) {
      errorMessage.value = 'Inserisci un indirizzo email valido'
      return
    }
    
    // Validazione password se i controlli di sicurezza sono abilitati
    if (securityControlsEnabled.value && !isValidPassword.value) {
      errorMessage.value = 'La password non soddisfa i requisiti di sicurezza'
      return
    }
    
    // Se i controlli di sicurezza sono disabilitati, controllo minimo di 6 caratteri
    if (!securityControlsEnabled.value && form.value.password.length < 6) {
      errorMessage.value = 'La password deve essere di almeno 6 caratteri'
      return
    }
    
    await createOperatoreAdmin(form.value, store.token)
    
    successMessage.value = `Operatore ${form.value.nome} ${form.value.cognome} creato con successo!`
    form.value = { nome: '', cognome: '', email: '', password: '' }
    showErrors.value = false
    
    // Nascondi messaggio di successo dopo 3 secondi
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
    
    fetchOperatori()
  } catch (err: any) {
    errorMessage.value = err.message || 'Errore nella creazione dell\'operatore'
    showError(
      'Errore nella creazione dell\'operatore',
      err.message || undefined,
      'Errore'
    )
  } finally {
    submitting.value = false
  }
}

const confirmRemove = async (operator: any) => {
  const result = await showConfirm(
    "Rimuovi operatore",
    `Sei sicuro di voler rimuovere l'operatore ${operator.nome} ${operator.cognome}?`
  );
  
  if (result) {
    await remove(operator._id)
  }
}

const remove = async (id: string) => {
  try {
    errorMessage.value = ''
    
    await deleteOperatore(id, store.token)
    
    successMessage.value = 'Operatore rimosso con successo!'
    
    // Nascondi messaggio di successo dopo 3 secondi
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
    
    fetchOperatori()
  } catch (err: any) {
    errorMessage.value = err.message || 'Errore nella rimozione dell\'operatore'
    showError(
      'Errore nella rimozione dell\'operatore',
      err.message || undefined,
      'Errore'
    )
  }
}

onMounted(fetchOperatori)
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: #f8f7f3;
  padding-bottom: 80px;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #fe4654;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Header */
.admin-header {
  background: #fff;
  margin: 1.5rem 1.5rem 1rem 1.5rem;
  border-radius: 1.2rem;
  padding: 2rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
}

.admin-info {
  flex: 1;
}

.admin-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #404149;
  margin: 0 0 0.5rem 0;
}

.admin-subtitle {
  color: #666;
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
}

.admin-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fe4654;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.2rem;
}

/* Form Section */
.form-section {
  background: #fff;
  margin: 0 1.5rem 2rem 1.5rem;
  border-radius: 1.2rem;
  padding: 2rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
}

.form-section h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #404149;
  margin: 0 0 1.5rem 0;
}

.operator-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #404149;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.75rem 1rem;
  border: 1.5px solid #fe4654;
  border-radius: 1rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  background: #f8f7f3;
}

.form-group input:focus {
  border-color: #404149;
}

.form-group input.error {
  border-color: #e74c3c;
  box-shadow: 0 0 5px rgba(231, 76, 60, 0.3);
}

.required-asterisk {
  color: #e74c3c;
  font-weight: bold;
  margin-left: 2px;
}

.field-error {
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: block;
}

.password-strength {
  margin-top: 10px;
}

.password-strength-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
}

.password-strength-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.password-strength-fill.weak {
  background-color: #e74c3c;
}

.password-strength-fill.medium {
  background-color: #f39c12;
}

.password-strength-fill.good {
  background-color: #3498db;
}

.password-strength-fill.strong {
  background-color: #27ae60;
}

.password-strength-text {
  font-size: 14px;
  font-weight: 500;
}

.password-strength-text.weak {
  color: #e74c3c;
}

.password-strength-text.medium {
  color: #f39c12;
}

.password-strength-text.good {
  color: #3498db;
}

.password-strength-text.strong {
  color: #27ae60;
}

.password-requirements {
  margin-top: 10px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.password-requirements h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #495057;
}

.requirement-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.requirement-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  font-size: 13px;
}

.requirement-item.valid {
  color: #28a745;
}

.requirement-item.invalid {
  color: #dc3545;
}

.requirement-item::before {
  content: '✓';
  margin-right: 8px;
  font-weight: bold;
}

.requirement-item.invalid::before {
  content: '✗';
}

.add-button {
  background: #fe4654;
  color: #fff;
  border: none;
  border-radius: 1rem;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
}

.add-button:hover:not(:disabled) {
  background: #404149;
  transform: translateY(-1px);
}

.add-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Messaggi */
.error-message {
  background: #fff2f2;
  color: #fe4654;
  padding: 0.875rem 1.25rem;
  border-radius: 1rem;
  border: 1px solid #fe4654;
  margin-top: 1rem;
  font-weight: 500;
}

.success-message {
  background: #e6fff2;
  color: #198754;
  padding: 0.875rem 1.25rem;
  border-radius: 1rem;
  border: 1px solid #198754;
  margin-top: 1rem;
  font-weight: 500;
}

/* Operators Section */
.operators-section {
  margin: 0 1.5rem 2rem 1.5rem;
}

.operators-section h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #404149;
  margin: 0 0 1.5rem 0;
  padding: 0 0.5rem;
}

/* Empty State */
.empty-state {
  background: #fff;
  border-radius: 1.2rem;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
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
  color: #666;
  margin: 0;
}

/* Operators Grid */
.operators-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.operator-card {
  background: #fff;
  border-radius: 1.2rem;
  padding: 1.5rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.operator-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
}

.operator-avatar {
  width: 60px;
  height: 60px;
  background: #fe4654;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.operator-info {
  flex: 1;
}

.operator-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #404149;
  margin: 0 0 0.25rem 0;
}

.operator-email {
  color: #666;
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
}

.operator-role {
  color: #fe4654;
  font-size: 0.8rem;
  font-weight: 600;
  background: #fee;
  padding: 0.2rem 0.6rem;
  border-radius: 0.5rem;
  display: inline-block;
  margin: 0;
}

.remove-button {
  background: none;
  color: #dc3545;
  border: 1px solid #dc3545;
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.remove-button:hover {
  background: #dc3545;
  color: #fff;
}

/* Responsive */
@media (min-width: 768px) {
  .form-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .operators-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .admin-header {
    margin: 2rem 2rem 1.5rem 2rem;
  }
  
  .form-section {
    margin: 0 2rem 2rem 2rem;
  }
  
  .operators-section {
    margin: 0 2rem 2rem 2rem;
  }
}

@media (min-width: 1024px) {
  .operators-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 767px) {
  .admin-header {
    margin: 1.5rem;
  }
}
</style>
