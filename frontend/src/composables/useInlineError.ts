import { ref } from 'vue'

export function useInlineError() {
  const errorMessage = ref('')
  const isVisible = ref(false)

  const showError = (message: string) => {
    errorMessage.value = message
    isVisible.value = true
  }

  const clearError = () => {
    errorMessage.value = ''
    isVisible.value = false
  }

  const hideError = () => {
    isVisible.value = false
  }

  return {
    errorMessage,
    isVisible,
    showError,
    clearError,
    hideError
  }
}
