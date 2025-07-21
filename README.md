# Benvenuto su InCrowd <img src="./static/logo.png" width="30">

Scopri l'applicazione che ti rende il protagonista della tua città!

InCrowd è la piattaforma di crowdfunding che mette al centro **le tue idee**. Proponi eventi, ricevi supporto dalla comunità e trasforma i tuoi progetti in realtà.

## 🚀 Funzionalità principali (in sviluppo):
- **Proponi un'idea:** Dai voce alle tue proposte per la tua città.
- **Metti Hype⚡️ e supporta:** Sostieni i progetti che ti ispirano di più.
- **Raggiungi gli obiettivi:** Collabora per trasformare idee in eventi reali.

## 🛠️ Tecnologie
- **Frontend & Backend:** SvelteKit
- **UI e Stile:** TailwindCSS, DaisyUI
- **Database:** MongoDB
- **Linguaggi:** TypeScript

## ⚙️ Configurazione ambiente
Copia `.env.example` in `.env` e compila le variabili seguenti:

```
MONGO_URI=<stringa di connessione>
JWT_SECRET=<chiave jwt>
GOOGLE_CLIENT_ID=<client id google>
ADMIN_EMAIL=<email admin>
ADMIN_PASSWORD=<password admin>
```

La chiave Google è necessaria per abilitare il login tramite Google.

## 🔑 Sistema di autenticazione

Gli account di tipo **operatore** possono essere creati solo da un amministratore
tramite l'apposita sezione di gestione. L'admin effettua l'accesso usando
l'email e la password definite nel file `.env`.

Sia gli utenti privati che gli enti possono registrarsi e accedere con email e
password oppure tramite Google. In caso di accesso con Google viene
memorizzato l'identificativo OAuth così da permettere login futuri senza
password.

Se un account non esiste ancora e si effettua l'accesso con Google, l'API
risponde indicandone la creazione mancante e si viene reindirizzati ad una
pagina per completare la registrazione con i dati precompilati.


---
> **InCrowd**: Dai forma alla tua città, un'idea alla volta. 🌟
