# InCrowd — Brief per il redesign del frontend

> Documento di contesto per l'agente design. Le immagini in questa cartella mostrano lo stato **attuale** del frontend (da rifare). Il testo qui sotto descrive cosa fa l'app, per chi, e quali pattern UI esistono.

---

## 1. Cos'è InCrowd

InCrowd è una **piattaforma community per proporre e sostenere eventi/iniziative sul territorio** (orientamento locale, es. Trento). Gli utenti pubblicano **proposte** di eventi (workshop, concerti, mostre, conferenze, sport, iniziative culturali); la community le sostiene con un meccanismo di **"hype"** (endorsement) e **commenti**; degli **operatori** moderano i contenuti prima della pubblicazione. È, in sostanza, un misto tra una bacheca di proposte di eventi e un piccolo social, con moderazione editoriale.

**Tagline implicita dell'app:** *"Scopri le ultime idee della community"* / *"Condividi la tua idea con la community"*.

---

## 2. Concetti di dominio (cosa esiste nell'app)

### Proposta (l'oggetto centrale)
Una proposta di evento creata da un utente. Campi:
- **titolo**, **descrizione**
- **categoria** (6 valori fissi): `cultura`, `concerti`, `mostreInstallazioni`, `sport`, `workshopCorsi`, `conferenze`
- **foto** di copertina
- **luogo** (indirizzo) e **dataIpotetica** (data prevista dell'evento)
- **hype**: lista di utenti che l'hanno sostenuta (il numero = endorsement)
- **stato di moderazione**: `in_approvazione` → `approvata` / `rifiutata` (con eventuale commento del moderatore)

Ciclo di vita: l'utente la crea → finisce **in approvazione** → un operatore la **approva o rifiuta** → se approvata diventa pubblica nel feed.

### Hype
Meccanica di endorsement (tipo "like" ma semanticamente "sostengo questa idea"). Mostrato come icona fulmine ⚡ + contatore sulle card. Gli operatori **non** possono fare hype (solo consultare/moderare).

### Commenti
Sui dettagli proposta. Supportano le **risposte** (thread a un livello: un commento può essere risposta a un altro).

### Follow
Sistema di **following polimorfico**: privati ed enti possono seguirsi a vicenda (privato↔ente). Sui profili compaiono i contatori Follower / Seguiti.

### Ricerca & filtri
Ricerca testuale di proposte ("Cerca proposte per titolo o descrizione") e di utenti/enti; filtri per categoria; tab di navigazione del feed (**Esplora / Seguiti / Classifica**).

---

## 3. I 4 tipi di utente (ruoli) — fondamentali per il design

| Ruolo | Chi è | Cosa fa | Note UI |
|---|---|---|---|
| **Utente privato** | persona singola (nome + cognome + codice fiscale) | crea proposte, hype, commenta, gestisce il proprio profilo, segue altri | navbar: Home / Aggiungi proposta / Profilo |
| **Ente** | organizzazione (solo "nome" come ragione sociale, no cognome) | come il privato ma rappresenta un'organizzazione; può sostenere proposte | badge "ENTE" sul profilo |
| **Operatore** | staff di moderazione | modera proposte (approva/rifiuta), legge ultimi commenti, vede lista utenti e contatori; **non** crea proposte né fa hype; **non** ha profilo pubblico | navbar dedicata "Pannello Operatore"; badge "Operatore" |
| **Amministratore** | gestore di sistema | **aggiunge e rimuove account operatore**; vede gestione operatori | navbar "Admin / Gestione Operatori"; badge "Admin" |

> La **navbar e i permessi cambiano per ruolo**: è un elemento di design ricorrente. Le rotte protette reindirizzano al login se il ruolo non è autorizzato.

---

## 4. Le schermate (mappate ai file in questa cartella)

1. **`01-feed-home.jpg` — Home / Feed.** Cuore dell'app. Barra di ricerca in alto, tab Esplora/Seguiti/Classifica, banner "Nuove Proposte", griglia di card proposta (foto, categoria, titolo, hype). È la schermata più importante da reinventare.
2. **`02-dettaglio-proposta.jpg` — Dettaglio proposta.** Hero con foto, titolo, autore, descrizione, box informazioni (luogo/data/categoria), enti sostenitori, sezione commenti con input.
3. **`03-profilo-utente.jpg` — Profilo utente.** Header con avatar, nome, badge tipo utente, bio, contatori (Proposte/Hyped/Follower/Seguiti), tab (Proposte / Hyped / Seguiti), griglia delle proposte dell'utente.
4. **`04-crea-proposta-wizard.jpg` — Creazione proposta.** Form **multi-step a 3 fasi** (Info Base → Foto → Luogo & Data) con stepper numerato.
5. **`05-signup-form.jpg` — Registrazione.** Form lungo con validazione (anche scelta privato/ente, codice fiscale, password forte).
6. **`06-login.jpg` — Login.** Email/password + "Login con Google" (OAuth).
7. **`07-dashboard-operatore.jpg` — Pannello operatore.** Banner intestazione, riga di **stat cards** (Proposte in attesa / approvate / rifiutate, Utenti registrati), card-strumento (Moderazione, Gestione Utenti, Ultimi Commenti) con contatori.
8. **`08-moderazione-proposte.jpg` — Moderazione.** Lista di proposte in attesa come card con badge "IN ATTESA" e azioni **Approva / Rifiuta / Dettagli**.
9. **`09-lista-utenti.jpg` — Gestione utenti/enti.** Griglia di card utente (avatar, nome, badge UTENTE/ENTE, bio, data registrazione, Dettagli/Contatta), con ricerca, filtro e ordinamento, e stat in alto.
10. **`10-dashboard-admin-operatori.jpg` — Admin / Gestione operatori.** Contatore operatori attivi, form "Aggiungi nuovo operatore" (nome/cognome/email/password), elenco operatori con bottone "Rimuovi".

> Schermate di stato non incluse (ma esistono): **404 / pagina non trovata**, **not-logged**, **empty state** ("Nessuna proposta ancora"), **completa registrazione Google**.

---

## 5. Linguaggio visivo attuale (da migliorare)

- **Brand:** logo circolare rosso/nero "InCrowd".
- **Colore accento:** rosso/corallo (`#ff4d5e`-ish), usato per CTA, badge, gradienti dei banner.
- **Stile:** card bianche su sfondo chiaro per i pannelli; il feed/proposte usa anche un tema scuro (header dark). **Incoerenza tra aree chiare e scure** — uno dei punti deboli.
- **Componenti ricorrenti:** card con immagine + badge categoria, stat cards, badge di ruolo/stato, stepper, tab pill, bottoni pill arrotondati, banner con gradiente rosso.
- **Emoji come icone** in più punti (⏳✅❌🛡️🔍) invece di un set di icone coerente.

### Punti deboli noti (obiettivi del redesign)
- Gerarchia visiva debole e spaziature incoerenti.
- Mix di tema chiaro/scuro non sistematico.
- Iconografia improvvisata (emoji) → serve un design system coerente.
- Card e form poco raffinati; densità informativa migliorabile.
- **L'app NON è responsive** (pensata solo desktop ~1920px). Un redesign mobile-first sarebbe un grosso valore aggiunto.

---

## 6. Stack tecnico (vincoli per il design)

- **Frontend:** Vue 3 + Vite + Pinia (store), Vue Router. SPA. → il design system dovrebbe tradursi in componenti Vue riutilizzabili.
- **Backend:** Node/Express + MongoDB (Mongoose), JWT + bcrypt, Google OAuth. Solido e da **non** rifare — il redesign è solo lato frontend/UI.
- **Lingua UI:** Italiano.

---

## 7. In una frase per il design

> *Reinventa il frontend di una piattaforma community italiana dove gli utenti propongono eventi locali, la gente li sostiene con "hype" e commenti, e operatori/admin moderano — con 4 ruoli che cambiano navbar e permessi, schermate feed/dettaglio/profilo, form di creazione multi-step e dashboard di moderazione. Serve un design system coerente, mobile-first, che risolva il mix incoerente di temi chiaro/scuro e l'iconografia a emoji.*
