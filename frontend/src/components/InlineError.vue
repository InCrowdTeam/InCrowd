<template>
  <Transition name="error-fade">
    <div v-if="show && message" class="inline-error">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ message }}</span>
      <button v-if="dismissible" @click="$emit('dismiss')" class="error-dismiss">×</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  message: string
  dismissible?: boolean
}

withDefaults(defineProps<Props>(), {
  dismissible: true
})

defineEmits<{
  dismiss: []
}>()
</script>

<style scoped>
.inline-error {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 0.8rem;
  padding: 0.8rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.error-text {
  flex: 1;
}

.error-dismiss {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.error-dismiss:hover {
  background: rgba(220, 53, 69, 0.1);
}

/* Transition */
.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.3s ease;
}

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
