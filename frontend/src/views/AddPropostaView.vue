<template>
  <div class="add-proposta-container">
    <!-- Header compatto -->
    <div class="header-section">
      <h1 class="main-title">Crea la tua Proposta</h1>
      <p class="subtitle">Condividi la tua idea con la community</p>
      
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

    <!-- Form Container -->
    <div class="form-container">
      <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
        
        <!-- Step 1: Informazioni Base -->
        <div v-show="currentStep === 1" class="step-content">
          <div class="step-header">
            <h2>Informazioni Base</h2>
          </div>
          
          <div class="form-grid">
            <div class="form-column">
              <div class="form-group">
                <label for="titolo" class="form-label">
                  <span class="label-icon">🎯</span>
                  Titolo della proposta
                </label>
                <input 
                  type="text" 
                  id="titolo" 
                  v-model="form.titolo" 
                  class="form-input"
                  placeholder="Es: Workshop di fotografia urbana"
                  required 
                />
              </div>
              
              <div class="form-group">
                <label for="categoria" class="form-label">
                  <span class="label-icon">🏷️</span>
                  Categoria
                </label>
                <select id="categoria-select" v-model="form.categoria" class="form-select" required>
                  <option value="">Seleziona una categoria</option>
                  <option value="cultura">🎭 Cultura</option>
                  <option value="concerti">🎵 Concerti</option>
                  <option value="mostreInstallazioni">🖼️ Mostre e installazioni</option>
                  <option value="sport">⚽ Sport</option>
                  <option value="workshopCorsi">📚 Workshop e corsi</option>
                  <option value="conferenze">🎤 Conferenze</option>
                </select>
              </div>
            </div>
            
            <div class="form-column">
              <div class="form-group">
                <label for="descrizione" class="form-label">
                  <span class="label-icon">📋</span>
                  Descrizione dettagliata
                </label>
                <textarea 
                  id="descrizione" 
                  v-model="form.descrizione" 
                  class="form-textarea"
                  placeholder="Descrivi la tua proposta in dettaglio..."
                  required
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Foto -->
        <div v-show="currentStep === 2" class="step-content">
          <div class="step-header">
            <h2>Aggiungi una Foto</h2>
          </div>
          
          <div class="upload-container">
            <div class="upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
              <div v-if="!form.foto.data" class="upload-placeholder">
                <div class="upload-icon">📁</div>
                <p class="upload-text">Clicca per selezionare o trascina qui la tua foto</p>
                <p class="upload-subtext">JPG, PNG fino a 10MB</p>
              </div>
              <div v-else class="upload-preview">
                <img :src="previewUrl" alt="Preview" class="preview-image" />
                <div class="preview-overlay">
                  <button type="button" @click.stop="removePhoto" class="remove-btn">✕</button>
                </div>
              </div>
            </div>
            <input 
              type="file" 
              id="foto" 
              ref="fileInput"
              @change="handleFileUpload" 
              class="file-input-hidden"
              accept="image/*"
            />
          </div>
        </div>

        <!-- Step 3: Luogo e Data -->
        <div v-show="currentStep === 3" class="step-content">
          <div class="step-header">
            <h2>Dove e Quando</h2>
          </div>
          
          <div class="form-grid">
            <div class="form-column">
              <div class="form-group">
                <label for="citta" class="form-label">
                  <span class="label-icon">🏙️</span>
                  Città
                </label>
                <input 
                  type="text" 
                  id="citta" 
                  v-model="form.indirizzo.citta" 
                  class="form-input"
                  placeholder="Es: Milano"
                  required 
                />
              </div>
              
              <div class="form-group">
                <label for="cap" class="form-label">
                  <span class="label-icon">📮</span>
                  CAP
                </label>
                <input 
                  type="text" 
                  id="cap" 
                  v-model="form.indirizzo.cap" 
                  class="form-input"
                  placeholder="20100"
                  required 
                />
              </div>
              
              <div class="form-group">
                <label for="via" class="form-label">
                  <span class="label-icon">🛣️</span>
                  Via
                </label>
                <input 
                  type="text" 
                  id="via" 
                  v-model="form.indirizzo.via" 
                  class="form-input"
                  placeholder="Es: Via Roma"
                  required 
                />
              </div>
              
              <div class="form-group">
                <label for="civico" class="form-label">
                  <span class="label-icon">🏠</span>
                  Civico
                </label>
                <input 
                  type="text" 
                  id="civico" 
                  v-model="form.indirizzo.civico" 
                  class="form-input"
                  placeholder="42"
                  required 
                />
              </div>
            </div>
            
            <div class="form-column">
              <div class="form-group">
                <label for="data" class="form-label">
                  <span class="label-icon">🗓️</span>
                  Data prevista
                </label>
                <input 
                  type="date" 
                  id="data" 
                  v-model="form.dataIpotetica" 
                  class="form-input"
                  required 
                />
              </div>

              <!-- Riepilogo -->
              <div class="summary-card">
                <h3>📋 Riepilogo</h3>
                <div class="summary-item">
                  <strong>Titolo:</strong> {{ form.titolo || 'Non specificato' }}
                </div>
                <div class="summary-item">
                  <strong>Categoria:</strong> {{ getCategoryLabel(form.categoria) || 'Non specificata' }}
                </div>
                <div class="summary-item">
                  <strong>Luogo:</strong> {{ form.indirizzo.via }} {{ form.indirizzo.civico }}, {{ form.indirizzo.citta }} {{ form.indirizzo.cap }}
                </div>
                <div class="summary-item">
                  <strong>Data:</strong> {{ formatDate(form.dataIpotetica) || 'Non specificata' }}
                </div>
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
            v-if="currentStep < steps.length"
            type="button" 
            @click="nextStep"
            class="btn btn-primary"
            :disabled="!canProceed"
          >
            Avanti
          </button>
          
          <button 
            v-if="currentStep === steps.length"
            type="submit" 
            class="btn btn-success"
            :disabled="isSubmitting || !canProceed"
          >
            <span v-if="isSubmitting" class="spinner"></span>
            {{ isSubmitting ? 'Creazione in corso...' : 'Crea Proposta' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="success-modal" @click.stop>
        <div class="success-icon">🎉</div>
        <h3>Proposta creata con successo!</h3>
        <p>La tua proposta è stata inviata e sarà presto esaminata dal nostro team.</p>
        <button @click="closeSuccessModal" class="btn btn-primary">Perfetto!</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/stores/userStore'

export default {
  setup() {
    const userStore = useUserStore();
    return { userStore };
  },
  data() {
    return {
      currentStep: 1,
      isSubmitting: false,
      showSuccessModal: false,
      previewUrl: null,
      steps: [
        { label: 'Info Base' },
        { label: 'Foto' },
        { label: 'Luogo & Data' }
      ],
      form: {
        titolo: "",
        descrizione: "",
        foto: {
          data: null,
          contentType: "",
        },
        categoria: "",
        indirizzo: {
          citta: "",
          cap: "",
          via: "",
          civico: "",
        },
        dataIpotetica: "",
        proponenteID: "",
      },
    };
  },
  computed: {
    progressPercentage() {
      return (this.currentStep / this.steps.length) * 100;
    },
    canProceed() {
      switch (this.currentStep) {
        case 1:
          return this.form.titolo && this.form.descrizione && this.form.categoria;
        case 2:
          return true; // Foto è opzionale
        case 3:
          return this.form.indirizzo.citta && this.form.indirizzo.cap && 
                 this.form.indirizzo.via && this.form.indirizzo.civico &&
                 this.form.dataIpotetica;
        default:
          return false;
      }
    }
  },
  mounted() {
    // Recupera l'ID utente loggato da Pinia
    if (this.userStore.user && this.userStore.user._id) {
      this.form.proponenteID = this.userStore.user._id
    }
  },
  watch: {
    // Aggiorna proponenteID quando cambia lo user nello store
    'userStore.user'(newUser) {
      if (newUser && newUser._id) {
        this.form.proponenteID = newUser._id;
      }
    }
  },
  methods: {
    nextStep() {
      if (this.canProceed && this.currentStep < this.steps.length) {
        this.currentStep++;
      }
    },
    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleDrop(event) {
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.processFile(files[0]);
      }
    },
    removePhoto() {
      this.form.foto.data = null;
      this.previewUrl = null;
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    processFile(file) {
      this.form.foto.data = file;
      
      // Crea preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.processFile(file);
      }
    },
    getCategoryLabel(category) {
      const categories = {
        'cultura': '🎭 Cultura',
        'concerti': '🎵 Concerti',
        'mostreInstallazioni': '🖼️ Mostre e installazioni',
        'sport': '⚽ Sport',
        'workshopCorsi': '📚 Workshop e corsi',
        'conferenze': '🎤 Conferenze'
      };
      return categories[category] || category;
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    closeSuccessModal() {
      this.showSuccessModal = false;
      // Reset form
      this.currentStep = 1;
      this.form = {
        titolo: "",
        descrizione: "",
        foto: {
          data: null,
          contentType: "",
        },
        categoria: "",
        indirizzo: {
          citta: "",
          cap: "",
          via: "",
          civico: "",
        },
        dataIpotetica: "",
        proponenteID: this.userStore.user?._id || "",
      };
      this.previewUrl = null;
      
      // Redirect alla home
      this.$router.push('/');
    },
    async handleSubmit() {
      try {
        // Verifica che l'utente sia autenticato
        if (!this.userStore.token) {
          alert("Devi essere loggato per creare una proposta!");
          return;
        }

        this.isSubmitting = true;

        this.form.stato = { stato: "in_approvazione", commento: "" };
        const statoPuro = {
          stato: this.form.stato.stato,
          commento: this.form.stato.commento
        };

        const formData = new FormData();
        formData.append("titolo", this.form.titolo);
        formData.append("descrizione", this.form.descrizione);
        // FormData gestisce correttamente i file binari
        if (this.form.foto.data) {
          formData.append("foto", this.form.foto.data);
        }
        formData.append("categoria", this.form.categoria);
        // Invia i dati dell'indirizzo come campi flat
        formData.append("indirizzo_citta", this.form.indirizzo.citta);
        formData.append("indirizzo_cap", this.form.indirizzo.cap);
        formData.append("indirizzo_via", this.form.indirizzo.via);
        formData.append("indirizzo_civico", this.form.indirizzo.civico);
        formData.append("dataIpotetica", this.form.dataIpotetica);
        formData.append("proponenteID", this.form.proponenteID);
        formData.append("stato", JSON.stringify({
          stato: this.form.stato.stato,
          commento: this.form.stato.commento ?? ""
        }));

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/proposte`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${this.userStore.token}`
          },
          body: formData,
        });
        
        const data = await response.json().catch(() => ({}));
        console.log("Status:", response.status, "Body:", data);
        if (!response.ok) throw new Error("Failed to create proposta");
        
        this.showSuccessModal = true;
      } catch (error) {
        console.error("Error creating proposta:", error);
        alert("Errore nella creazione della proposta.");
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.add-proposta-container {
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
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
  overflow: hidden;
}

.step-content {
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
.form-textarea,
.form-select {
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
.form-textarea:focus,
.form-select:focus {
  border-color: #fe4654;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(254, 70, 84, 0.1);
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
}

.form-select {
  cursor: pointer;
}

/* Upload Area */
.upload-container {
  margin: 1rem 0;
  display: flex;
  justify-content: center;
}

.upload-area {
  border: 2px dashed #e0e0e0;
  border-radius: 1.2rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  position: relative;
  width: 100%;
  max-width: 400px;
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
  font-size: 2.5rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.upload-text {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.upload-subtext {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.upload-preview {
  position: relative;
  display: inline-block;
}

.preview-image {
  max-width: 250px;
  max-height: 200px;
  border-radius: 1.2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.preview-overlay {
  position: absolute;
  top: -8px;
  right: -8px;
}

.remove-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #ef4444;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.remove-btn:hover {
  background: #dc2626;
}

.file-input-hidden {
  display: none;
}

/* Summary Card */
.summary-card {
  background: #f8f7f3;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
  border: 1px solid #e2e8f0;
}

.summary-card h3 {
  margin: 0 0 1rem 0;
  color: #404149;
  font-size: 1rem;
  font-weight: 600;
}

.summary-item {
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
  color: #374151;
  font-size: 0.875rem;
}

.summary-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.summary-item strong {
  color: #1e293b;
  margin-right: 0.5rem;
}

/* Navigation Buttons */
.navigation-buttons {
  display: flex;
  justify-content: space-between;
  padding: 1.5rem 3rem 2rem;
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
  background: #059669;
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
  
  .step-content {
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
  
  .upload-area {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 1.5rem;
  }
  
  .step-content {
    padding: 1rem;
  }
  
  .upload-area {
    padding: 1rem;
  }
  
  .upload-icon {
    font-size: 2rem;
  }
}
</style>
