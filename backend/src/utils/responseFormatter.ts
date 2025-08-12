// responseFormatter.ts
// Helper per uniformare tutte le risposte API

export function apiResponse({ data = undefined, message = '', error = undefined }: {
  data?: any;
  message: string;
  error?: any;
}) {
  return {
    data,
    message,
    ...(error !== undefined && { error })
  };
}

// Esempio d'uso:
// return res.json(apiResponse({ data: user, message: 'Utente trovato' }))
// return res.status(400).json(apiResponse({ message: 'Errore', error }))
