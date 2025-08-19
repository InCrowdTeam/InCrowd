# 🧪 InCrowd API Test Suite

Questa cartella contiene tutti i file necessari per testare l'API InCrowd utilizzando Jest e comandi curl manuali.

## 📁 Struttura della Cartella

```
test/
├── README.md              # Questo file
├── test.js                # Test suite Jest completa
├── curl.txt               # Comandi curl per test manuali
├── jest.config.js         # Configurazione Jest
├── test.setup.js          # Setup globale per Jest
├── test.env.js            # Configurazione ambiente test
└── __tests__/             # Cartella per test aggiuntivi (opzionale)
```

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+ installato
- Server InCrowd attivo su `http://localhost:3000`
- Dipendenze installate (`npm install` nella cartella `backend`)

### Esecuzione Test Jest

```bash
# Dalla cartella backend
npm test

# Test in modalità watch (ri-esegue automaticamente)
npm run test:watch

# Test con coverage report
npm run test:coverage

# Test verbose
npm run test:verbose
```

### Test Manuali con cURL

```bash
# Copia e incolla i comandi da curl.txt
# Esempio:
curl http://localhost:3000/api/health
```

## 📋 Test Disponibili

### 1. Test di Connessione
- ✅ Verifica server attivo
- ✅ Health check endpoint

### 2. Test di Autenticazione
- ✅ Login admin
- ✅ Login operatore
- ✅ Login utente
- ✅ Gestione errori credenziali

### 3. Test Gestione Operatori (Solo Admin)
- ✅ Creazione operatore
- ✅ Lista operatori
- ✅ Eliminazione operatore
- ✅ Controllo accessi non autorizzati

### 4. Test Gestione Utenti (Solo Operatore)
- ✅ Creazione utenti privati
- ✅ Creazione enti
- ✅ Lista tutti gli utenti
- ✅ Validazione campi obbligatori

### 5. Test Gestione Proposte
- ✅ Creazione proposta
- ✅ Approvazione/rifiuto (operatore)
- ✅ Visualizzazione proposte pubbliche
- ✅ Gestione proposte utente

### 6. Test di Ricerca e Filtri
- ✅ Ricerca proposte
- ✅ Ricerca utenti
- ✅ Gestione query speciali

### 7. Test di Sicurezza
- ✅ Validazione token
- ✅ Controllo permessi
- ✅ Protezione SQL injection
- ✅ Protezione XSS

### 8. Test di Performance
- ✅ Gestione richieste multiple
- ✅ Timeout configurabili
- ✅ Rate limiting

## 🔧 Configurazione

### Variabili d'Ambiente Test
Le variabili d'ambiente per i test sono configurate in `test.env.js`:

```javascript
{
  MONGO_URI: 'mongodb://localhost:27017/incrowd-test',
  JWT_SECRET: 'test-jwt-secret-key',
  PORT: 3001,
  NODE_ENV: 'test'
}
```

### Configurazione Jest
La configurazione Jest è in `jest.config.js`:

- **Timeout**: 30 secondi per chiamate API
- **Coverage**: 70% minimo richiesto
- **Environment**: Node.js
- **Mock**: Abilitati per servizi esterni

## 📊 Coverage Report

Dopo l'esecuzione dei test con coverage, i report sono disponibili in:

```
test/coverage/
├── lcov-report/          # Report HTML
├── lcov.info            # Report LCOV
└── junit.xml            # Report JUnit XML
```

## 🐛 Troubleshooting

### Problemi Comuni

#### 1. "Connection refused"
```bash
# Verifica che il server sia attivo
curl http://localhost:3000/api/health
```

#### 2. "401 Unauthorized"
```bash
# Rinnova il token facendo nuovo login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@incrowd.com","password":"admin123!"}'
```

#### 3. "403 Forbidden"
- Verifica i permessi dell'utente
- Controlla il ruolo richiesto per l'endpoint

#### 4. "400 Bad Request"
- Controlla la struttura dei dati inviati
- Verifica i campi obbligatori

### Debug dei Test

```bash
# Test con output dettagliato
npm run test:verbose

# Test singolo con debug
npm test -- --testNamePattern="Admin login should work"

# Test con console.log abilitato
DEBUG=* npm test
```

## 📝 Aggiungere Nuovi Test

### 1. Test Unitari
Crea file nella cartella `__tests__/`:

```javascript
// __tests__/userController.test.js
describe('User Controller Tests', () => {
  test('should create user successfully', async () => {
    // Test implementation
  });
});
```

### 2. Test di Integrazione
Aggiungi al file `test.js` principale:

```javascript
describe('New Feature Tests', () => {
  test('should handle new endpoint', async () => {
    // Test implementation
  });
});
```

### 3. Test cURL
Aggiungi comandi al file `curl.txt`:

```bash
# Test nuovo endpoint
curl -X POST http://localhost:3000/api/new-endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 🔒 Sicurezza

### Dati di Test
- I test utilizzano dati fittizi
- Le password sono generate automaticamente
- I codici fiscale sono validi ma non reali
- Le email sono nel dominio `@test.com`

### Database di Test
- Utilizza database separato (`incrowd-test`)
- I dati vengono puliti dopo ogni test
- Non influisce sul database di produzione

## 📈 Metriche e Performance

### Tempi di Esecuzione
- **Test singoli**: < 1 secondo
- **Suite completa**: ~2-3 minuti
- **Timeout**: 30 secondi per endpoint lenti

### Coverage Target
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 🤝 Contribuire

### Linee Guida
1. Mantieni i test semplici e leggibili
2. Usa nomi descrittivi per i test
3. Aggiungi commenti per test complessi
4. Aggiorna questo README quando aggiungi nuovi test

### Best Practices
- Un test per ogni funzionalità
- Setup e teardown appropriati
- Mock per servizi esterni
- Validazione completa delle risposte

## 📚 Risorse Utili

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [cURL Tutorial](https://curl.se/docs/tutorial.html)
- [API Testing Best Practices](https://www.postman.com/blog/api-testing-best-practices/)
- [Node.js Testing](https://nodejs.org/en/docs/guides/testing-and-debugging/)

## 🎯 Prossimi Passi

- [ ] Aggiungere test per endpoint commenti
- [ ] Implementare test per gestione follow
- [ ] Aggiungere test di stress e load
- [ ] Integrare con CI/CD pipeline
- [ ] Aggiungere test per frontend Vue.js

---

**Buon Testing! 🚀**

Per supporto o domande, consulta la documentazione o contatta il team di sviluppo.
