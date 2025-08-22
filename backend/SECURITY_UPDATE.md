# Aggiornamento Sicurezza - Endpoint GET /api/proposte/:id

## Descrizione della Modifica

L'endpoint `GET /api/proposte/:id` è stato aggiornato per implementare controlli di sicurezza più rigorosi.

### Comportamento Precedente
- Endpoint completamente pubblico
- Qualsiasi proposta era visibile indipendentemente dallo stato
- Nessun controllo di sicurezza

### Comportamento Attuale
- **Pubblico**: Solo proposte con stato "approvata" sono visibili
- **Proprietario**: Può vedere le proprie proposte indipendentemente dallo stato
- **Sicurezza**: Accesso negato (403) per proposte non approvate da utenti non proprietari

## Implementazione Tecnica

### Modifiche al Controller
- Aggiunta verifica JWT opzionale per identificare il proprietario
- Controllo condizionale dello stato della proposta
- Gestione errori con messaggi appropriati

### Modifiche alle Route
- Endpoint rimane pubblico ma con controlli di sicurezza
- Documentazione aggiornata per riflettere il nuovo comportamento

### Modifiche ai Test
- Test aggiunti per verificare il comportamento di sicurezza
- Test esistenti aggiornati per usare autenticazione quando necessario
- Verifica che utenti non proprietari non possano accedere a proposte non approvate

## Impatto sui Test

### Test Aggiornati
- `rf8.inserimento-proposta.test.js`: Test di sicurezza aggiunti
- Test esistenti aggiornati per usare token di autenticazione

### Test Non Influenzati
- Test che usano proposte approvate continuano a funzionare
- Test di altri endpoint non sono stati modificati

## Benefici della Modifica

1. **Sicurezza**: Le proposte non approvate non sono più esposte pubblicamente
2. **Privacy**: I proprietari mantengono accesso alle proprie proposte
3. **Consistenza**: Comportamento allineato con altri endpoint che filtrano per stato
4. **Controllo**: Migliore gestione dell'accesso ai dati sensibili

## Compatibilità

- **Backward Compatible**: Le proposte approvate rimangono visibili pubblicamente
- **Frontend**: Nessuna modifica richiesta per utenti pubblici
- **API**: Struttura delle risposte invariata

## Note di Implementazione

- L'endpoint rimane pubblico per mantenere la compatibilità
- La verifica JWT è opzionale e non richiede autenticazione obbligatoria
- I messaggi di errore sono chiari e informativi
- La logica è coerente con il pattern esistente nel sistema
