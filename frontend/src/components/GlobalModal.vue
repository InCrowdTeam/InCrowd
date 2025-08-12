<template>
  <Teleport to="body">
    <div v-if="modalState.isVisible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content" @click.stop>
        <!-- Success Modal -->
        <div v-if="modalState.config.type === 'success'" class="success-modal">
          <div class="success-icon">🎉</div>
          <h3>{{ modalState.config.title }}</h3>
          <p>{{ modalState.config.message }}</p>
          <button @click="handleConfirm" class="btn btn-primary">
            {{ modalState.config.confirmText || 'Perfetto!' }}
          </button>
        </div>

        <!-- Error Modal -->
        <div v-else-if="modalState.config.type === 'error'" class="error-modal">
          <div class="error-icon">⚠️</div>
          <h3>{{ modalState.config.title }}</h3>
          <p>{{ modalState.config.message }}</p>
          
          <!-- Dettagli errore -->
          <div v-if="modalState.config.details" class="error-details">
            <button @click="showDetails = !showDetails" class="details-toggle">
              {{ showDetails ? 'Nascondi dettagli tecnici' : 'Mostra dettagli tecnici' }}
            </button>
            <div v-if="showDetails" class="details-content">
              {{ modalState.config.details }}
            </div>
          </div>
          
          <button @click="handleConfirm" class="btn btn-primary">
            {{ modalState.config.confirmText || 'Ho capito' }}
          </button>
        </div>

        <!-- Warning Modal -->
        <div v-else-if="modalState.config.type === 'warning'" class="warning-modal">
          <div class="warning-icon">⚠️</div>
          <h3>{{ modalState.config.title }}</h3>
          <p>{{ modalState.config.message }}</p>
          <div class="modal-actions">
            <button @click="handleCancel" class="btn btn-secondary">
              {{ modalState.config.cancelText || 'Annulla' }}
            </button>
            <button @click="handleConfirm" class="btn btn-primary">
              {{ modalState.config.confirmText || 'Continua' }}
            </button>
          </div>
        </div>

        <!-- Confirm Modal -->
        <div v-else-if="modalState.config.type === 'confirm'" class="confirm-modal">
          <div class="confirm-icon">🗑️</div>
          <h3>{{ modalState.config.title }}</h3>
          <p>{{ modalState.config.message }}</p>
          <div class="modal-actions">
            <button @click="handleCancel" class="btn btn-secondary">
              {{ modalState.config.cancelText || 'Annulla' }}
            </button>
            <button @click="handleConfirm" class="btn btn-danger">
              {{ modalState.config.confirmText || 'Conferma' }}
            </button>
          </div>
        </div>

        <!-- Info Modal -->
        <div v-else-if="modalState.config.type === 'info'" class="info-modal">
          <div class="info-icon">ℹ️</div>
          <h3>{{ modalState.config.title }}</h3>
          <p>{{ modalState.config.message }}</p>
          <button @click="handleConfirm" class="btn btn-primary">
            {{ modalState.config.confirmText || 'OK' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useModal } from '@/composables/useModal'

const { modalState, handleConfirm, handleCancel } = useModal()
const showDetails = ref(false)

const handleOverlayClick = () => {
  if (!modalState.config.showCancel) {
    handleCancel()
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease-out;
}

/* Base Modal Styles - following AddPropostaView success modal */
.success-modal,
.error-modal,
.warning-modal,
.confirm-modal,
.info-modal {
  text-align: center;
}

.success-modal .success-icon,
.error-modal .error-icon,
.warning-modal .warning-icon,
.confirm-modal .confirm-icon,
.info-modal .info-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  display: block;
}

.success-modal h3,
.error-modal h3,
.warning-modal h3,
.confirm-modal h3,
.info-modal h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #404149;
}

.success-modal p,
.error-modal p,
.warning-modal p,
.confirm-modal p,
.info-modal p {
  font-size: 1rem;
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.5;
}

/* Buttons */
.btn {
  padding: 0.75rem 2rem;
  border-radius: 25px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
  font-size: 1rem;
}

.btn-primary {
  background: #fe4654;
  color: white;
}

.btn-primary:hover {
  background: #e83e4c;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #e9ecef;
  color: #404149;
  margin-right: 1rem;
}

.btn-secondary:hover {
  background: #dee2e6;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

/* Modal Actions (for two buttons) */
.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

/* Error Details */
.error-details {
  margin: 1.5rem 0;
  text-align: left;
}

.details-toggle {
  background: none;
  border: none;
  color: #fe4654;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
  padding: 0;
  margin-bottom: 1rem;
}

.details-toggle:hover {
  color: #e83e4c;
}

.details-content {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 10px;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: #495057;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

/* Animation */
@keyframes modalSlideIn {
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
    padding: 1.5rem;
    width: 95vw;
    border-radius: 15px;
  }
  
  .success-modal .success-icon,
  .error-modal .error-icon,
  .warning-modal .warning-icon,
  .confirm-modal .confirm-icon,
  .info-modal .info-icon {
    font-size: 3rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .btn-secondary {
    margin-right: 0;
    margin-bottom: 1rem;
  }
}
</style>
