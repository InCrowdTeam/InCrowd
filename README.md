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

## 🔐 Login con Google

Per abilitare l'autenticazione con Google imposta la variabile d'ambiente `GOOGLE_CLIENT_ID` nel backend con l'ID OAuth 2.0 della tua applicazione.

Nel frontend è stato aggiunto un esempio di pulsante "Sign in with Google" nella pagina di login. Al termine dell'autenticazione viene inviato l'`idToken` all'endpoint `/api/auth/google` esposto dal backend.


---
> **InCrowd**: Dai forma alla tua città, un'idea alla volta. 🌟