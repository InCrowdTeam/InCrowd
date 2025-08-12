<template>
  <Transition name="confirm-fade">
    <div v-if="show" class="inline-confirm">
      <span class="confirm-icon">{{ icon }}</span>
      <span class="confirm-text">{{ message }}</span>
      <div class="confirm-actions">
        <button @click="$emit('cancel')" class="btn-cancel">{{ cancelText }}</button>
        <button @click="$emit('confirm')" class="btn-confirm">{{ confirmText }}</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  message: string
  icon?: string
  confirmText?: string
  cancelText?: string
}

withDefaults(defineProps<Props>(), {
  icon: '❓',
  confirmText: 'Conferma',
  cancelText: 'Annulla'
})

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
.inline-confirm {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 0.8rem;
  padding: 1rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.confirm-icon {
  flex-shrink: 0;
  font-size: 1.2rem;
}

.confirm-text {
  flex: 1;
  color: #856404;
  font-size: 0.9rem;
  font-weight: 500;
}

.confirm-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-cancel,
.btn-confirm {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.btn-cancel:hover {
  background: #e9ecef;
  color: #495057;
}

.btn-confirm {
  background: linear-gradient(135deg, #fe4654, #404149);
  color: white;
  box-shadow: 0 2px 8px rgba(254, 70, 84, 0.3);
}

.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(254, 70, 84, 0.4);
}

/* Transition */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: all 0.3s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
