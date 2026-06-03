/**
 * Converte un allegato immagine (oggetto { data, contentType }) in una data-URL
 * utilizzabile come `src`. Logica estratta da HomeView.vue (era duplicata nelle view).
 */
export function processImageUrl(foto: unknown): string {
  const f = foto as { data?: unknown; contentType?: string } | null | undefined
  if (!f || !f.data) return ''

  try {
    if (typeof f.data === 'string') {
      return `data:${f.contentType || 'image/jpeg'};base64,${f.data}`
    }

    if (Array.isArray(f.data)) {
      let binary = ''
      const bytes = new Uint8Array(f.data as number[])
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      return `data:${f.contentType || 'image/jpeg'};base64,${btoa(binary)}`
    }
  } catch (e) {
    console.error("Errore nella conversione dell'immagine:", e)
  }

  return ''
}
