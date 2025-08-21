# Changelog Documentazione API InCrowd

## [1.1.0] - 2025-01-XX - Correzioni Discrepanze

### 🔧 Correzioni Principali

#### 1. **Endpoint Password Corretto**
- **Prima**: Documentato come "Cambia password" con `currentPassword` + `newPassword`
- **Dopo**: Corretto come "Imposta password" solo con `newPassword`
- **Motivo**: L'implementazione reale non permette di cambiare password esistenti

#### 2. **Ruoli e Permessi Allineati**
- **Prima**: Documentato che gli admin possono moderare proposte
- **Dopo**: Corretto che gli admin NON possono moderare proposte
- **Motivo**: Implementazione reale limita gli admin alla gestione operatori

#### 3. **Separazione Ruoli Chiarita**
- **Prima**: Confusione sui permessi admin vs operatori
- **Dopo**: Documentata separazione intenzionale dei ruoli per sicurezza

### 📝 Modifiche Dettagliate

#### Sezione Autenticazione
- Aggiunta nota su limitazione cambio password
- Documentato endpoint solo per impostazione password (OAuth users)
- Chiarito che non esiste reset password automatico

#### Sezione Ruoli
- Corretti permessi admin (solo gestione operatori)
- Chiariti permessi operatori (moderazione e gestione utenti)
- Aggiunta sezione "Separazione dei Ruoli e Sicurezza"

#### Endpoint Specifici
- `/api/auth/password`: Corretto da "change" a "set"
- `/api/proposte/pending`: Chiarito accesso solo operatori
- `/api/proposte/commenti`: Chiarito accesso solo operatori  
- `/api/user`: Chiarito accesso solo operatori

#### Nuove Sezioni
- "Limitazioni Note e Soluzioni"
- "Workaround per Admin"
- "Design di Sicurezza Intenzionale"

### 🎯 Risultato

La documentazione API ora riflette correttamente:
- ✅ **Implementazione reale** del codice
- ✅ **Limitazioni intenzionali** di sicurezza
- ✅ **Separazione dei ruoli** admin/operatore
- ✅ **Soluzioni alternative** per casi d'uso comuni
- ✅ **Workaround** per admin che devono moderare

### 📋 Prossimi Passi

Per completare la funzionalità mancante:
1. **Implementare cambio password**: `PATCH /api/auth/change-password`
2. **Implementare reset password**: `POST /api/auth/reset-password`
3. **Considerare super-admin**: Ruolo con tutti i privilegi (se necessario)

### 🔍 Verifica

La documentazione è ora allineata con:
- `backend/src/routes/authRoutes.ts`
- `backend/src/routes/userRoutes.ts`
- `backend/src/routes/propostaRoutes.ts`
- `backend/src/routes/followRoutes.ts`
- `backend/src/routes/operatoreRoutes.ts`
- `backend/src/app.ts`
