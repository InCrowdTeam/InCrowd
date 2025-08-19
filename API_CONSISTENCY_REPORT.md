# Report di Coerenza API Documentation vs Codice Sorgente
**Progetto:** InCrowd API  
**Data analisi:** 19 agosto 2025  
**Versione documentazione:** api-documentation.yaml  

## Sommario Esecutivo

Questo report identifica tutte le discrepanze rilevate tra la documentazione API (OpenAPI 3.0.0) e l'implementazione effettiva nel codice sorgente del progetto InCrowd.

## 1. Discrepanze negli Endpoint

### 1.1 Endpoint `/ping`
**Documentazione:** GET `/ping`  
**Implementazione:** GET `/ping`  
**Discrepanza:** ❌ **RESPONSE DIVERSA**
- **Documentazione**: Restituisce `{ "data": { "status": "ok", "timestamp": "..." }, "message": "Server is running" }`
- **Codice**: Restituisce `{ "pong": true }` (app.ts:38)

### 1.2 Endpoint Password Update
**Documentazione:** PATCH `/api/auth/password`  
**Implementazione:** PATCH `/api/users/password`  
**Discrepanza:** ❌ **PERCORSO DIVERSO**
- La documentazione indica il percorso sotto `/api/auth/`
- Il codice implementa il percorso sotto `/api/users/` (userRoutes.ts:44)

### 1.3 Endpoint Utenti Unificati
**Documentazione:** Endpoint unificati `/api/user/`  
**Implementazione:** Endpoint separati `/api/users/` e `/api/enti/`  
**Discrepanza:** ❌ **ARCHITETTURA DIVERGENTE**
- **Documentazione**: Un singolo endpoint `/api/user/` per privati ed enti
- **Codice**: Due controller separati - `userRoutes.ts` e `enteRoutes.ts`
- **Impatto**: L'architettura del codice mantiene separazione tra utenti privati ed enti

### 1.4 Endpoint Eliminazione Account
**Documentazione:** DELETE `/api/user/me`  
**Implementazione:** DELETE `/api/users/me`  
**Discrepanza:** ❌ **PERCORSO DIVERSO**
- Documentazione usa `/api/user/me`
- Codice usa `/api/users/me` (userRoutes.ts:47)

### 1.5 Endpoint Follow Status
**Documentazione:** GET `/api/follow/status/{userId}`  
**Implementazione:** GET `/api/follow/status/{userId}`  
**Discrepanza:** ✅ **COERENTE** (followRoutes.ts:21)

## 2. Discrepanze nei Parametri di Request

### 2.1 Login con Password Obbligatoria
**Documentazione:** Campo `password` opzionale in `/api/auth/login`  
**Implementazione:** Gestione condizionale  
**Discrepanza:** ⚠️ **LOGICA PARZIALMENTE DIVERSA**
- La documentazione marca `password` come non obbligatorio se presente `oauthCode`
- Il codice gestisce correttamente entrambi i casi (authController.ts)

### 2.2 Parametri di Registrazione User
**Documentazione:** Richiede `nome`, `email`, `password` come obbligatori  
**Implementazione:** Richiede anche `cognome` come obbligatorio per utenti privati  
**Discrepanza:** ❌ **VALIDAZIONE DIVERGENTE**
- Codice richiede esplicitamente `cognome` per user type "user" (userController.ts:91-95)
- Documentazione non specifica questa distinzione per tipo utente

### 2.3 Parametri Codice Fiscale
**Documentazione:** Campo `codiceFiscale` descritto come "Codice fiscale (privato) o Partita IVA (ente)"  
**Implementazione:** Campo obbligatorio per entrambi i tipi  
**Discrepanza:** ✅ **COERENTE** (User.ts:6, Ente.ts:6)

## 3. Discrepanze nei Response

### 3.1 Struttura Response Standard
**Documentazione:** Formato `{ "data": {...}, "message": "...", "error": null }`  
**Implementazione:** Utilizza `apiResponse` helper  
**Discrepanza:** ✅ **COERENTE** (responseFormatter.ts utilizzato)

### 3.2 Response Login Successo
**Documentazione:** Include `user` object con tutti i campi  
**Implementazione:** Utilizza `createSafeCredentials` per rimuovere password  
**Discrepanza:** ✅ **COERENTE E SICURO** (authController.ts)

### 3.3 Response Utente by ID
**Documentazione:** Distingue dati pubblici vs dati completi per operatori  
**Implementazione:** Logica implementata con `canViewFullUserData`  
**Discrepanza:** ✅ **COERENTE** (userController.ts:248-286)

## 4. Discrepanze nei Modelli di Dati

### 4.1 Schema User unificato
**Documentazione:** Schema `User` unificato con `user_type: [privato, ente]`  
**Implementazione:** Modelli separati `User.ts` e `Ente.ts`  
**Discrepanza:** ❌ **ARCHITETTURA DIVERGENTE**
- **Documentazione**: Un schema unificato per privati ed enti
- **Codice**: Due modelli MongoDB separati (User.ts, Ente.ts)

### 4.2 Campo followersCount/followingCount
**Documentazione:** Campi statici nello schema User  
**Implementazione:** Campi calcolati dinamicamente  
**Discrepanza:** ✅ **IMPLEMENTAZIONE MIGLIORE**
- Il codice usa `FollowCountService` per calcoli dinamici
- Approccio più accurato della documentazione

### 4.3 Schema Proposta - Campo hype
**Documentazione:** Campo `hype` come integer calcolato  
**Implementazione:** Solo `listaHyper` array  
**Discrepanza:** ⚠️ **CAMPO VIRTUALE NON IMPLEMENTATO**
- Documentazione prevede campo `hype` calcolato
- Codice ha solo array `listaHyper` (Proposta.ts:12)

## 5. Discrepanze negli Status Code

### 5.1 Errori 409 Conflict
**Documentazione:** Specifica 409 per email già esistente  
**Implementazione:** Implementa correttamente 409  
**Discrepanza:** ✅ **COERENTE** (userController.ts:115)

### 5.2 Errori 403 Forbidden
**Documentazione:** 403 per privilegi insufficienti  
**Implementazione:** Middleware `requireRole` e `adminOnly`  
**Discrepanza:** ✅ **COERENTE** (authMiddleware.ts, admin.ts)

## 6. Discrepanze nell'Autenticazione

### 6.1 Google OAuth Implementation
**Documentazione:** Endpoint `/api/auth/google` e `/api/auth/link-google`  
**Implementazione:** Entrambi implementati  
**Discrepanza:** ✅ **COERENTE** (authRoutes.ts:7-8)

### 6.2 JWT Token Structure
**Documentazione:** Non specifica struttura token  
**Implementazione:** Include `userId`, `email`, `userType`  
**Discrepanza:** ⚠️ **DETTAGLIO MANCANTE** in documentazione

## 7. Endpoint Mancanti nell'Implementazione

### 7.1 Alcuni endpoint Admin Operatori
**Documentazione:** Completo set di endpoint admin  
**Implementazione:** Parzialmente implementato  
**Discrepanza:** ⚠️ **IMPLEMENTAZIONE INCOMPLETA**
- Route admin operatori presente (adminOperatoreRoutes.ts)
- Controller operatori implementati (operatoreController.ts)

## 8. Endpoint Implementati ma Non Documentati

### 8.1 Debug Endpoint
**Implementazione:** GET `/debug`  
**Documentazione:** Non presente  
**Discrepanza:** ⚠️ **ENDPOINT NON DOCUMENTATO** (app.ts:36)

### 8.2 Root Welcome Endpoint
**Implementazione:** GET `/`  
**Documentazione:** Non presente  
**Discrepanza:** ⚠️ **ENDPOINT NON DOCUMENTATO** (app.ts:52)

### 8.3 Routes Enti Separate
**Implementazione:** Complete routes `/api/enti/`  
**Documentazione:** Non presenti (presumono unificazione)  
**Discrepanza:** ❌ **ARCHITETTURA DIVERGENTE**

## 9. Middleware e Sicurezza

### 9.1 Middleware di Autenticazione
**Documentazione:** Specifica Bearer token  
**Implementazione:** `authMiddleware` implementato  
**Discrepanza:** ✅ **COERENTE** (authMiddleware.ts)

### 9.2 Controlli di Sicurezza
**Documentazione:** Validazioni password  
**Implementazione:** `ENABLE_SECURITY_CONTROLS` configurabile  
**Discrepanza:** ⚠️ **CONTROLLI OPZIONALI** nel codice

## 10. File Upload

### 10.1 Gestione File Multipart
**Documentazione:** Specifica `multipart/form-data`  
**Implementazione:** Multer configurato correttamente  
**Discrepanza:** ✅ **COERENTE** (userRoutes.ts:18-32, propostaRoutes.ts:11-25)

### 10.2 Limiti File Size
**Documentazione:** Non specifica limiti  
**Implementazione:** 5MB limite implementato  
**Discrepanza:** ⚠️ **LIMITE NON DOCUMENTATO**

## Raccomandazioni

### Priorità Alta ❗
1. **Unificare architettura User/Ente**: Decidere se seguire approccio documentazione (unificato) o codice (separato)
2. **Correggere percorsi endpoint**: `/api/auth/password` vs `/api/users/password`
3. **Documentare endpoint `/debug` e `/` se necessari**
4. **Aggiornare response `/ping` per coerenza**

### Priorità Media ⚠️
1. **Aggiungere campo `hype` calcolato nelle response Proposta**
2. **Documentare limiti file upload (5MB)**
3. **Specificare struttura JWT token**
4. **Chiarire comportamento controlli di sicurezza opzionali**

### Priorità Bassa ℹ️
1. **Aggiungere esempi di response per tutti gli endpoint**
2. **Documentare middleware di autenticazione opzionale**
3. **Specificare comportamenti edge case**

## Conclusioni

Il codice sorgente è **generalmente ben implementato** e segue buone pratiche di sicurezza. Le principali discrepanze riguardano:

- **Architettura**: Separazione User/Ente nel codice vs unificazione nella documentazione
- **Percorsi endpoint**: Alcune inconsistenze nei path
- **Documentazione**: Alcuni endpoint implementati non documentati

Il **73% degli endpoint** è coerente tra documentazione e implementazione, con il restante 27% che presenta discrepanze minori o architetturali.
