# InCrowd

**La piattaforma di crowdsourcing che trasforma le idee dei cittadini in realtà**

InCrowd è una piattaforma web completa per la gestione di proposte cittadine, che permette a privati ed enti di proporre iniziative, raccogliere supporto dalla comunità e trasformare le idee in progetti concreti attraverso un sistema di "hype" e moderazione professionale.

## 🚀 Funzionalità Principali

### 👥 **Gestione Utenti Multi-Ruolo**
- **Utenti Privati**: Cittadini che possono proporre idee e supportare progetti
- **Enti/Organizzazioni**: Organizzazioni che gestiscono proposte istituzionali  
- **Operatori**: Moderatori che approvano/rifiutano proposte e gestiscono contenuti
- **Amministratori**: Gestione completa del sistema e degli operatori

### 📝 **Sistema Proposte**
- **Creazione Proposte**: Con titolo, descrizione, foto, categoria, luogo e data ipotetica
- **Sistema Hype**: Gli utenti possono "hypare" le proposte per mostrare supporto
- **Moderazione**: Workflow di approvazione/rifiuto da parte degli operatori
- **Stati Proposta**: In attesa, approvata, rifiutata, finale
- **Ricerca Avanzata**: Filtri per categoria, stato, ordinamento per data/hype

### 💬 **Sistema Commenti**
- Commenti su singole proposte
- Moderazione commenti da parte degli operatori
- Visualizzazione cronologica degli ultimi commenti globali

### 👥 **Sistema Follow**
- Follow/Unfollow tra utenti
- Visualizzazione proposte degli utenti seguiti
- Statistiche followers/following nei profili

### 🔐 **Autenticazione Avanzata**
- **Login Tradizionale**: Email e password con validazione robusta
- **Login Google OAuth**: Integrazione completa con Google Sign-In
- **Registrazione Guidata**: Processo multi-step per privati ed enti
- **JWT Security**: Token sicuri con scadenza configurabile (7 giorni)

### 📊 **Dashboard e Pannelli**
- **Pannello Operatore**: Statistiche, moderazione proposte, gestione utenti
- **Pannello Admin**: Gestione operatori del sistema
- **Profili Utente**: Proposte personali, proposte hypate, utenti seguiti
- **Analytics**: Contatori hype, followers, proposte per stato

## 🛠️ Architettura Tecnica

### **Backend (Node.js + TypeScript)**
```
backend/
├── src/
│   ├── controllers/     # Logica business (auth, user, proposta, operatore, follow)
│   ├── models/          # Modelli MongoDB (User, Ente, Proposta, Operatore, etc.)
│   ├── routes/          # Definizione endpoint API REST
│   ├── middleware/      # Auth, error handling, validazione ruoli
│   ├── utils/           # Helper (password validation, email, file utils)
│   └── types/           # Definizioni TypeScript
└── tests/               # Test suite completa con Jest
```

**Stack Backend:**
- **Runtime**: Node.js 22.15.1
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB con Mongoose 8.14.1
- **Autenticazione**: JWT + bcrypt + Google Auth Library
- **File Upload**: Multer (immagini profilo e proposte)
- **Testing**: Jest con MongoDB Memory Server
- **Validazione**: Custom validators per password e codice fiscale

### **Frontend (Vue.js 3 + TypeScript)**
```
frontend/
├── src/
│   ├── views/           # Pagine principali (Home, Login, Profilo, etc.)
│   ├── components/      # Componenti riutilizzabili (Modal, Search, etc.)
│   ├── stores/          # State management con Pinia (user, follow)
│   ├── api/             # Client HTTP per comunicazione con backend
│   ├── services/        # Servizi business logic (Date, Follow, Proposta, User)
│   ├── composables/     # Logica riutilizzabile Vue 3
│   └── types/           # Definizioni TypeScript condivise
```

**Stack Frontend:**
- **Framework**: Vue.js 3.5.13 con Composition API
- **Build Tool**: Vite 6.3.5
- **State Management**: Pinia 3.0.2
- **Routing**: Vue Router 4.5.1
- **HTTP Client**: Axios 1.9.0
- **Styling**: CSS custom con design system coerente
- **TypeScript**: Supporto completo con vue-tsc

### **Database Schema**
```javascript
// Utenti Privati
User (Privato) {
  nome, cognome, codiceFiscale, biografia, fotoProfilo,
  credenziali: { email, password?, oauthCode? }
}

// Enti/Organizzazioni  
Ente {
  nome_org, nome?, codiceFiscale, biografia, fotoProfilo,
  credenziali: { email, password?, oauthCode? }
}

// Proposte
Proposta {
  titolo, descrizione, foto?, categoria, luogo, dataIpotetica,
  stato, proponenteID, listaHyper[], commenti[]
}

// Sistema Follow
Follow {
  followerId, followingId, createdAt
}
```

## ⚙️ Configurazione e Setup

### **Variabili d'Ambiente**
```bash
# Database
MONGO_URI=mongodb://localhost:27017/incrowd  # o "memory" per testing

# Sicurezza
JWT_SECRET=your-super-secret-jwt-key
ENABLE_SECURITY_CONTROLS=true  # false per disabilitare validazioni password

# OAuth Google
GOOGLE_CLIENT_ID=your-google-oauth-client-id

# Admin Account
ADMIN_EMAIL=admin@incrowd.com
ADMIN_PASSWORD=your-admin-password

# Server
PORT=3000
```

### **Installazione e Avvio**

#### Sviluppo Locale
```bash
# Backend
cd backend
npm install
npm run dev          # Sviluppo con nodemon

# Frontend  
cd frontend
npm install
npm run dev          # Sviluppo con Vite HMR
```

#### Produzione
```bash
# Backend
npm run build        # TypeScript -> JavaScript
npm start            # Avvio produzione

# Frontend
npm run build        # Build ottimizzato
npm run preview      # Preview build locale
```

#### Docker (Containerizzazione)
```bash
# Backend (Multi-stage build con Alpine)
docker build -t incrowd-backend ./backend
docker run -p 3000:3000 incrowd-backend

# Frontend (Nginx Alpine)
docker build -t incrowd-frontend ./frontend  
docker run -p 80:80 incrowd-frontend
```

### **Testing**
```bash
cd backend
npm test             # Jest test suite completa
                     # Include test per tutti i RF (requisiti funzionali)
```

**CI/CD Automatico**: I test vengono eseguiti automaticamente ad ogni push tramite **GitHub Actions**, garantendo che tutte le modifiche passino la suite di test completa prima dell'integrazione.

## 🔧 API Documentation

L'API REST è completamente documentata con **OpenAPI 3.0** in `/api-docs/api-documentation.yaml`.

### **Endpoint Principali**

#### Autenticazione
- `POST /api/auth/login` - Login email/password o admin
- `POST /api/auth/google` - Login Google OAuth
- `POST /api/auth/set-password` - Impostazione password per account OAuth

#### Gestione Utenti
- `POST /api/user` - Registrazione utenti (privati/enti)
- `GET /api/user/me` - Profilo utente corrente
- `PATCH /api/user/profile` - Aggiornamento profilo
- `GET /api/user/search` - Ricerca utenti pubblica
- `GET /api/user/:id` - Profilo utente specifico

#### Proposte
- `GET /api/proposte` - Lista proposte approvate pubbliche
- `POST /api/proposte` - Creazione nuova proposta (auth)
- `GET /api/proposte/search` - Ricerca proposte con filtri
- `PATCH /api/proposte/:id/hyper` - Hype/unhype proposta
- `POST /api/proposte/:id/commenti` - Aggiunta commento

#### Moderazione (Solo Operatori)
- `GET /api/proposte/pending` - Proposte in attesa moderazione
- `PATCH /api/proposte/:id/stato` - Approvazione/rifiuto proposte
- `GET /api/proposte/commenti` - Tutti i commenti globali

#### Follow System
- `POST /api/follow` - Follow/unfollow utente
- `GET /api/follow/status/:userId` - Stato follow specifico
- `GET /api/follow/stats/:userId` - Statistiche follow utente

#### Amministrazione (Solo Admin)
- `POST /api/operatori` - Creazione operatori
- `GET /api/operatori` - Lista operatori
- `DELETE /api/operatori/:id` - Eliminazione operatore

### **Formato Response Standard**
```json
{
  "data": { /* dati risposta */ },
  "message": "Messaggio descrittivo",
  "error": { /* dettagli errore se presente */ }
}
```

## 🎨 Interfaccia Utente

### **Design System**
- **Navbar Dinamiche**: Diversi stili per Admin (rosso), Operatori (grigio-rosso), End Users (grigio)
- **Responsive Design**: Ottimizzato per desktop, tablet e mobile
- **Accessibilità**: Supporto screen reader, navigazione keyboard
- **Theme Coerente**: Palette colori consistente con InCrowd branding

### **Pagine Principali**
- **Home**: Ricerca proposte/utenti, catalogo pubblico, dashboard personalizzata
- **Profilo**: Gestione account, proposte personali, statistiche follow
- **Aggiungi Proposta**: Form guidato con upload immagini
- **Moderazione**: Pannello operatori per gestione contenuti
- **Admin**: Gestione operatori di sistema

### **Features UX**
- **Ricerca Unificata**: Switch tra ricerca proposte e utenti
- **Modal Globali**: Conferme, errori, successi centralizzati
- **Loading States**: Feedback visivo per tutte le operazioni async
- **Error Handling**: Messaggi di errore user-friendly
- **Navigazione Intelligente**: Guard routes basati su ruoli utente

## 🔒 Sicurezza e Permessi

### **Sistema Ruoli**
```
Admin          → Gestione operatori
Operatori      → Moderazione contenuti, gestione utenti  
Privati/Enti   → Creazione proposte, hype, commenti, follow
Pubblico       → Visualizzazione proposte approvate, ricerca
```

### **Validazioni Sicurezza**
- **Password**: 8+ caratteri, maiuscola, minuscola, carattere speciale
- **File Upload**: 5MB max, solo immagini (JPEG, PNG, GIF, WebP)
- **Input Sanitization**: Protezione XSS su tutti gli input utente
- **JWT Security**: Token firmati, scadenza configurabile
- **Role-Based Access**: Middleware di autorizzazione granulare

### **Privacy e GDPR**
- **Eliminazione Account**: Cancellazione completa dati utente
- **Controllo Dati**: Utenti gestiscono i propri dati
- **Anonimizzazione**: Possibilità di anonimizzare contenuti

## 📊 Testing e Qualità

### **Test Coverage Completo**
- **RF1**: Registrazione utenti (privati/enti, validazioni, duplicati)
- **RF2**: Sistema autenticazione (admin, OAuth, credenziali)  
- **RF3**: Visualizzazione proposte e profili
- **RF4**: Ricerca avanzata proposte e utenti
- **RF5-RF12**: Follow, profili, impostazioni, hype, commenti, inserimento, follow, gestione operatori

### **Qualità Codice**
- **TypeScript**: Type safety completo frontend e backend
- **ESLint + Prettier**: Code style consistente
- **Modular Architecture**: Separazione responsabilità chiara
- **Error Boundaries**: Gestione errori robusta
- **Performance**: Lazy loading, ottimizzazioni bundle

## 🚀 Deployment e Produzione

### **Containerizzazione Docker**
- **Backend**: Multi-stage build Alpine Linux ottimizzato
- **Frontend**: Nginx Alpine con build production ottimizzata
- **Database**: Supporto MongoDB locale o cloud (MongoDB Atlas)

### **Configurazioni Ambiente**
- **Development**: Hot reload, debugging, MongoDB memory
- **Testing**: Isolated test database, mock services  
- **Production**: Ottimizzazioni build, security headers, monitoring

### **Scalabilità**
- **Stateless Backend**: Horizontal scaling ready
- **CDN Ready**: Static assets ottimizzati per CDN
- **Database Indexing**: Query ottimizzate per performance
- **Caching Strategy**: Ready per implementazione Redis/Memcached

## 📈 Roadmap e Sviluppi Futuri

- **Sistema Notifiche**: Push notifications per hype, commenti, follow
- **Geolocalizzazione**: Mappa interattiva delle proposte per zona
- **Sistema Voti**: Meccanismo di voto più sofisticato oltre l'hype
- **API Mobile**: Endpoint ottimizzati per app mobile
- **Analytics Dashboard**: Metriche dettagliate per operatori e admin
- **Integration Webhooks**: Notifiche esterne per sistemi terzi

---

## 📞 Supporto e Contributi

Per domande, bug report o richieste di feature, utilizza il sistema di issue del repository.

**InCrowd**: Trasformiamo le idee dei cittadini in realtà, una proposta alla volta. 🌟

---

### Crediti Tecnici
- **Backend**: Node.js + Express + MongoDB + TypeScript
- **Frontend**: Vue.js 3 + Pinia + Vite + TypeScript  
- **Testing**: Jest + MongoDB Memory Server
- **Deployment**: Docker + Alpine Linux + Nginx