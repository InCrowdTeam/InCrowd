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
              <label for="nome">Nome</label>
              <input 
                id="nome"
                v-model="form.nome" 
                type="text"
                placeholder="Nome operatore" 
                required 
              />
            </div>
            <div class="form-group">
              <label for="cognome">Cognome</label>
              <input 
                id="cognome"
                v-model="form.cognome" 
                type="text"
                placeholder="Cognome operatore" 
                required 
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                id="email"
                v-model="form.email" 
                type="email"
                placeholder="email@esempio.com" 
                required 
              />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input 
                id="password"
                v-model="form.password" 
                type="password"
                placeholder="Password sicura" 
                required 
              />
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
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'

const operatori = ref<any[]>([])
const form = ref({ nome: '', cognome: '', email: '', password: '' })
const store = useUserStore()

// Stati UI
const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const fetchOperatori = async () => {
  try {
    loading.value = true
    const res = await fetch('http://localhost:3000/api/admin/operatori', {
      headers: { Authorization: `Bearer ${store.token}` }
    })
    
    if (!res.ok) {
      throw new Error('Errore nel caricamento operatori')
    }
    
    operatori.value = await res.json()
  } catch (err) {
    console.error('Errore:', err)
    errorMessage.value = 'Errore nel caricamento degli operatori'
  } finally {
    loading.value = false
  }
}

const create = async () => {
  try {
    submitting.value = true
    errorMessage.value = ''
    successMessage.value = ''
    
    const res = await fetch('http://localhost:3000/api/admin/operatori', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${store.token}` 
      },
      body: JSON.stringify(form.value)
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      if (res.status === 409) {
        errorMessage.value = 'Email già registrata nel sistema. Scegli un\'altra email.'
      } else {
        errorMessage.value = data.message || 'Errore nella creazione dell\'operatore'
      }
      return
    }
    
    successMessage.value = `Operatore ${form.value.nome} ${form.value.cognome} creato con successo!`
    form.value = { nome: '', cognome: '', email: '', password: '' }
    
    // Nascondi messaggio di successo dopo 3 secondi
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
    
    fetchOperatori()
  } catch (err) {
    console.error('Errore:', err)
    errorMessage.value = 'Errore di rete nella creazione dell\'operatore'
  } finally {
    submitting.value = false
  }
}

const confirmRemove = async (operator: any) => {
  if (confirm(`Sei sicuro di voler rimuovere l'operatore ${operator.nome} ${operator.cognome}?`)) {
    await remove(operator._id)
  }
}

const remove = async (id: string) => {
  try {
    errorMessage.value = ''
    
    const res = await fetch(`http://localhost:3000/api/admin/operatori/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${store.token}` }
    })
    
    if (!res.ok) {
      const data = await res.json()
      errorMessage.value = data.message || 'Errore nella rimozione dell\'operatore'
      return
    }
    
    successMessage.value = 'Operatore rimosso con successo!'
    
    // Nascondi messaggio di successo dopo 3 secondi
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
    
    fetchOperatori()
  } catch (err) {
    console.error('Errore:', err)
    errorMessage.value = 'Errore di rete nella rimozione dell\'operatore'
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
