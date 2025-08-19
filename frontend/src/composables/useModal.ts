/**
 * Composable per gestione modal unificata
 * Sistema centralizzato per messaggi, conferme ed errori
 */

import { reactive } from 'vue'

export type ModalType = 'success' | 'error' | 'warning' | 'confirm' | 'info'

export interface ModalConfig {
  type: ModalType
  title: string
  message: string
  details?: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}

interface ModalState {
  isVisible: boolean
  config: ModalConfig
  resolve?: (value: boolean) => void
}

// Stato globale del modal
const modalState = reactive<ModalState>({
  isVisible: false,
  config: {
    type: 'info',
    title: '',
    message: '',
    showCancel: false
  }
})

export function useModal() {
  /**
   * Mostra un messaggio di successo
   */
  const showSuccess = (message: string, title = 'Successo') => {
    return showModal({
      type: 'success',
      title,
      message,
      confirmText: 'OK',
      showCancel: false
    })
  }

  /**
   * Mostra un messaggio di errore
   */
  const showError = (message: string, details?: string, title = 'Errore') => {
    return showModal({
      type: 'error',
      title,
      message,
      details,
      confirmText: 'OK',
      showCancel: false
    })
  }

  /**
   * Mostra un messaggio di warning
   */
  const showWarning = (message: string, title = 'Attenzione') => {
    return showModal({
      type: 'warning',
      title,
      message,
      confirmText: 'OK',
      showCancel: false
    })
  }

  /**
   * Mostra un modal di conferma
   */
  const showConfirm = (
    message: string,
    title = 'Conferma',
    confirmText = 'Conferma',
    cancelText = 'Annulla'
  ): Promise<boolean> => {
    return showModal({
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      showCancel: true
    })
  }

  /**
   * Mostra un messaggio informativo
   */
  const showInfo = (message: string, title = 'Informazione') => {
    return showModal({
      type: 'info',
      title,
      message,
      confirmText: 'OK',
      showCancel: false
    })
  }

  /**
   * Funzione base per mostrare il modal
   */
  const showModal = (config: ModalConfig): Promise<boolean> => {
    modalState.config = { ...config }
    modalState.isVisible = true

    return new Promise((resolve) => {
      modalState.resolve = resolve
    })
  }

  /**
   * Chiude il modal e risolve la promise
   */
  const closeModal = (result = false) => {
    modalState.isVisible = false
    if (modalState.resolve) {
      modalState.resolve(result)
      modalState.resolve = undefined
    }
  }

  /**
   * Gestione click di conferma
   */
  const handleConfirm = () => {
    closeModal(true)
  }

  /**
   * Gestione click di annullamento
   */
  const handleCancel = () => {
    closeModal(false)
  }

  return {
    // Stato
    modalState,
    
    // Funzioni per mostrare modal
    showSuccess,
    showError,
    showWarning,
    showConfirm,
    showInfo,
    
    // Funzioni di controllo
    closeModal,
    handleConfirm,
    handleCancel
  }
}
