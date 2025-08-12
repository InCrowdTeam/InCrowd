<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <h3>Dettagli Proposta</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <!-- Body -->
      <div class="modal-body">
        <div v-if="proposta" class="proposal-details">
          <!-- Immagine -->
          <div v-if="proposta.foto" class="proposal-image">
            <img :src="getImageUrl(proposta.foto)" alt="Foto proposta" />
          </div>
          
          <!-- Info principali -->
          <div class="proposal-info">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">📝 Titolo:</span>
                <span class="value">{{ proposta.titolo }}</span>
              </div>
              
              <div class="info-item">
                <span class="label">📋 Categoria:</span>
                <span class="value">{{ proposta.categoria || 'Non specificata' }}</span>
              </div>
              
              <div class="info-item">
                <span class="label">📍 Luogo:</span>
                <span class="value">
                  {{ proposta.indirizzo?.citta || 'Non specificato' }}
                  <span v-if="proposta.indirizzo?.via">
                    , {{ proposta.indirizzo.via }}
                    <span v-if="proposta.indirizzo?.civico">{{ proposta.indirizzo.civico }}</span>
                  </span>
                </span>
              </div>
              
              <div class="info-item">
                <span class="label">📅 Data creazione:</span>
                <span class="value">{{ formatDate(proposta.createdAt) }}</span>
              </div>
              
              <div class="info-item">
                <span class="label">🔥 Hyper:</span>
                <span class="value">{{ proposta.listaHyper?.length || 0 }}</span>
              </div>
              
              <div class="info-item">
                <span class="label">📊 Stato:</span>
                <span class="value">
                  <span class="status-badge" :class="getStatusClass(proposta.stato?.stato)">
                    {{ getStatusText(proposta.stato?.stato) }}
                  </span>
                </span>
              </div>
            </div>
            
            <!-- Descrizione -->
            <div class="description-section">
              <span class="label">📄 Descrizione:</span>
              <div class="description-text">{{ proposta.descrizione }}</div>
            </div>
            
            <!-- Commento stato se presente -->
            <div v-if="proposta.stato?.commento" class="comment-section">
              <span class="label">💬 Commento moderazione:</span>
              <div class="comment-text">{{ proposta.stato.commento }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-primary">Chiudi</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  proposta: any
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

function getImageUrl(foto: any): string {
  if (!foto || !foto.data) return '';
  
  try {
    if (typeof foto.data === 'string') {
      return `data:${foto.contentType || 'image/jpeg'};base64,${foto.data}`;
    }
    
    if (Array.isArray(foto.data)) {
      let binary = '';
      const bytes = new Uint8Array(foto.data);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return `data:${foto.contentType || 'image/jpeg'};base64,${btoa(binary)}`;
    }
  } catch (e) {
    console.error('Errore nel processare l\'immagine:', e);
  }
  return '';
}

function formatDate(dateString: string): string {
  if (!dateString) return 'Non specificata';
  return new Date(dateString).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'approvata': return 'status-approved'
    case 'rifiutata': return 'status-rejected'
    case 'in_approvazione': return 'status-pending'
    default: return 'status-unknown'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'approvata': return 'Approvata'
    case 'rifiutata': return 'Rifiutata'
    case 'in_approvazione': return 'In attesa'
    default: return 'Sconosciuto'
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
}

.modal-header h3 {
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  max-height: calc(90vh - 200px);
}

.proposal-image {
  margin-bottom: 1.5rem;
  text-align: center;
}

.proposal-image img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.value {
  color: #1f2937;
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-approved {
  background: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-unknown {
  background: #f3f4f6;
  color: #6b7280;
}

.description-section,
.comment-section {
  margin-top: 1.5rem;
  grid-column: 1 / -1;
}

.description-text,
.comment-text {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  line-height: 1.6;
  color: #374151;
  border-left: 4px solid #fe4654;
}

.comment-text {
  border-left-color: #6366f1;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-primary {
  background: linear-gradient(135deg, #fe4654, #404149);
  color: white;
  box-shadow: 0 4px 12px rgba(254, 70, 84, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(254, 70, 84, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to { 
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
