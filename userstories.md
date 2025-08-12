# 1\. User stories

**User story 1: Registrazione utente**

**Come** nuovo utente **voglio** registrarmi alla piattaforma **per** accedere alle funzioni che richiedono interazione.

**Criteri di accettazione:**

* La registrazione non è obbligatoria (per le funzionalità che non richiedono identificazione) e l’utente può scegliere in qualsiasi momento di registrarsi all’applicazione.  
* Al termine della registrazione, il sistema conduce l'utente alla home page delle proposte.   
* La registrazione può fallire per diversi motivi, in questo caso l’utente verrà notificato dell’errore.

**TASKS – User Story 1:**

1. **Integrare il pulsante di registrazione nella navbar, visibile in tutte le parti del sito**  
* Il pulsante una volta premuto premuto porta alla pagina di registrazione;  
* Il tasto è visibile se l’utente non è autenticato;  
* Di conseguenza anche la pagina è accessibile solo se l’utente non è autenticato.  
2. **Validare la registrazione e avviare la sessione**  
* Verificare che i campi siano stati compilati correttamente e salvati nella base di dati;  
* Salvare nella sessione attuale i dati dell’utente, il suo ruolo e il token univoco della sessione JWT.  
3. **Configurare il reindirizzamento verso la pagina home**  
* L’utente a registrazione completata verrà reindirizzato alla pagina home dove potrà visualizzare le proposte pubblicate dagli altri utenti e iniziare a sfruttare delle funzioni della piattaforma.  
4. **Implementare i messaggi di errore**  
* Gestire le situazioni di errore più comuni che comprendono:  
  * Utente autenticato che entra nella pagina di registrazione;  
  * Errori di connessione al backend e/o al database;  
  * Utenti già registrati che provano a chiamare l’API di registrazione.  
5. **Testare la registrazione in diverse situazioni limite**  
* Testare la registrazione (API/Pagina frontend) provando a replicare gli errori descritti.

**User story 2: Scelta del metodo di registrazione**

**Come** nuovo utente **voglio** scegliere se registrarmi con credenziali locali o con Google OAuth **per** poter selezionare il metodo di accesso che preferisco.

**Criteri di accettazione**

* La scelta è a discrezione dell’utente, pertanto, il metodo scelto non influenzerà il funzionamento e l’esperienza dell’utente sulla piattaforma.  
* La scelta riguarda il metodo di autenticazione, i campi richiesti all’utente sono gli stessi. In base al tipo di modalità scelta, la compilazione dei campi verrà richiesta in momenti diversi.

**TASKS – User Story 2:**

1. **Predisporre il form da registrazione mostrando le due scelte di autenticazione disponibili**  
* In alto verrà posizionato il tasto “Accedi con Google”;  
* Verrà mostrata l’opzione più sotto di procedere alla compilazione di tutti i campi richiesti; tra cui le credenziali (Indirizzo email e password).  
* Verrà predisposta anche una pagina apposita per chi sceglie l’autenticazione Google, che non richiede determinati dati presi direttamente dall’account OAuth.  
2. **Gestire il flusso di dati verso il backend**  
* Capire che flusso seguire in base alla scelta del tipo di autenticazione effettuata dall’utente.  
* Se l’utente ha scelto OAuth Google:  
  * Reindirizzare l’utente alla pagina di accesso Google;  
  * Configurare il callback verso la pagina di completamento della registrazione;  
  * Importare i dati presenti nell’account Google, tra cui il codice di identificazione OAuth;  
  * Chiedere all’utente la compilazione dei campi non salvati nell’account Google (Codice fiscale, biografia…);  
* Se l’utente ha scelto la registrazione tramite Credenziali locali  
  * L’utente verrà invitato a compilare ogni campo obbligatorio, segnalato da un asterisco (\*).  
  * Validare singolarmente ogni campo in base alla sintassi prevista (formato per il codice fiscale, criteri di sicurezza per la password…);  
  * Segnalare, in caso, se l’utente ha sbagliato a compilare uno o più campi previsti;  
  * Codificare la password tramite un hash sicuro;  
3. **Implementare i messaggi di errore**  
* Gestire le situazioni di errore più comuni che comprendono:  
  * L’utente ha annullato la registrazione con Google;  
  * Errori di formattazione;  
  * Errore di processamento della foto profilo di Google;  
  * In caso di errore generico, mostrare il messaggio d'errore.  
4. **Testare la registrazione in diverse situazioni limite**  
* Testare la registrazione (API/Pagina frontend) provando a replicare gli errori descritti.

**User story 3: Scelta del ruolo**

**Come** nuovo utente **voglio** scegliere se registrarmi come utente privato o ente **per** mostrare agli altri utenti il mio profilo in modo coerente con la mia identità e gli scopi con cui utilizzo la piattaforma.

**Criteri di accettazione**

* L'utente può selezionare tra opzioni “Privato” o “Ente”.  
* La scelta è a discrezione dell’utente, e sarà visibile pubblicamente agli altri utenti della piattaforma.

**TASKS – User Story 3:**

1. **Predisporre il form di registrazione per la scelta del ruolo.**  
* La scelta verrà effettuata dall’utente tramite un selettore posizionato prima della scelta del metodo di autenticazione;  
* Mostrare i campi adeguati in base alla scelta.  
2. **Aggiornare la logica di validazione del form**  
* Verificare che i campi obbligatori varino correttamente in base al tipo di utente selezionato;  
* Impedire la registrazione se i dati richiesti per il ruolo selezionato non sono completi o corretti.  
3. **Salvare il ruolo scelto nel database utente**  
* Estendere il modello utente per includere il campo della tipologian di account (es .privato, ente).  
4. **Aggiornare il profilo utente per mostrare il tipo di account**  
* Rendere visibile all’utente il tipo di account scelto.  
* Mostrare il badge identificativo sul profilo per distinguere enti da privati  
5. **Scrivere test automatici per le diverse casistiche di registrazione**  
* Registrazione come privato;  
* Registrazione come ente;  
* Validazioni mancate o errate. 

### **User story 4: Login**

**Come** utente registrato (privato, ente, operatore, admin) **voglio** accedere alla piattaforma **per** usufruire delle funzioni del sito e gestire i miei dati.

### **Criteri di accettazione:**

* Il login deve permettere l’accesso tramite credenziali locali oppure Google OAuth, a discrezione dell’utente.  
* In caso di credenziali errate o fallimento nell’autenticazione Google, l’utente riceve un messaggio di errore chiaro.  
* Una volta autenticato, l’utente viene reindirizzato alla propria dashboard, diversa a seconda del ruolo.  
* Se l’utente è già autenticato e prova ad accedere alla pagina di login, viene automaticamente reindirizzato alla propria dashboard.  
* Il sistema salva un token di sessione JWT valido per mantenere attiva la sessione.  
* In caso di scadenza o invalidazione del token, l’utente viene reindirizzato alla pagina di login.

**TASKS – User Story 4:**

1. **Creare la pagina di login**  
* Inserire due modalità di autenticazione:  
  * Tasto “Accedi con Google” (OAuth);  
  * Form per l’inserimento di email e password (cred. locali);  
* Aggiungere link “Hai dimenticato la password?” per recupero.  
* Verificare che la pagina non sia accessibile da utenti già autenticati.  
2. **Gestire il flusso di login con Google OAuth**  
* Reindirizzare l’utente alla pagina di autorizzazione Google;  
* Gestire il callback e la verifica del token OAuth;  
* Creare una nuova sessione utente con i dati ottenuti (o aggiornarla se già esistente);  
* In caso di problemi (annullamento, mancato consenso, errore token), mostrare un messaggio di errore.  
3. **Gestire il login con credenziali locali**  
* Validare l’indirizzo email e la password (non vuoti, formattazione corretta);  
* Confrontare la password con quella salvata (hash);  
* In caso di credenziali errate, mostrare un messaggio di errore;  
* Alla riuscita, creare una sessione utente salvando il JWT token.  
4. **Reindirizzare alla dashboard in base al ruolo**  
* Dopo login, il sistema deve controllare il ruolo dell’utente (privato, ente, operatore, admin);  
* Reindirizzare l’utente alla relativa dashboard;  
* Mostrare le funzionalità disponibili per il ruolo.  
5. **Salvare e validare il token di sessione JWT**  
* Salvare il token in un cookie sicuro o localStorage secondo policy di sicurezza;  
* In ogni accesso alle pagine protette, verificare la validità del token;  
* In caso di token scaduto o invalido, forzare il logout e redirigere alla login.  
6. **Mostrare messaggi di errore nei casi più comuni**  
* Email o password errati;  
* Token Google non valido o rifiutato;  
* Problemi di connessione al server;  
* Tentativo di login da parte di un utente già autenticato.  
7. **Scrivere test per i casi di login**  
* Login corretto con Google e credenziali;  
* Login con credenziali errate;  
* Reindirizzamento alla dashboard corretta;  
* Accesso non consentito a utenti già loggati;  
* Validazione del token JWT e gestione scadenza.

### **User Story 5: Logout**

**Come** utente registrato **voglio** effettuare il logout **per** uscire dal mio account ed evitare accessi non autorizzati.

### **Criteri di accettazione:**

* Il logout deve essere accessibile in modo semplice e visibile, preferibilmente tramite un pulsante o menù nell’area utente.  
* Una volta effettuato il logout, la sessione deve essere invalidata e il token JWT rimosso.  
* Dopo il logout, l’utente deve essere reindirizzato automaticamente alla home page delle proposte pubbliche.  
* Le funzionalità riservate agli utenti autenticati non devono più essere visibili o accessibili dopo il logout.  
* Se l’utente prova a visitare una pagina riservata dopo il logout, viene rediretto alla pagina di login o alla home.

### **TASKS – User Story 5:**

1. **Aggiungere il pulsante di logout nell’interfaccia**  
* Inserire il pulsante nella navbar;  
  Mostrare il pulsante solo se l’utente è autenticato;  
* Il pulsante è rappresentato da un emoji di una porta, l’accessibilità è gestita tramite una scritta visualizzabile tramite hover sul pulsante stesso.  
2. **Implementare la logica di logout**  
* Invalidare il token di sessione JWT tramite rimozione dalla memoria locale.  
3. **Reindirizzare alla home delle proposte pubbliche**  
* Dopo l’invalidazione della sessione, eseguire il redirect automatico alla home delle proposte.  
4. **Nascondere le funzionalità riservate agli utenti loggati**  
* Rimuovere o disabilitare pulsanti e voci del menù che richiedono l’autenticazione (es. “Crea proposta”, “Dashboard”, “Profilo”);  
* Mostrare invece pulsanti di login/registrazione.  
5. **Gestire l’accesso a pagine protette dopo logout**  
* Se l’utente prova ad accedere a pagine riservate senza token JWT valido, il sistema deve:  
  * reindirizzarlo alla pagina di login, oppure  
  * reindirizzarlo alla home con un messaggio di avviso.  
6. **Scrivere test per i casi di logout**  
* Logout riuscito con redirect corretto;  
* Tentativi di accesso a pagine protette dopo il logout;  
* Controllo che i dati utente siano stati rimossi e il token cancellato;  
* Verifica che le funzionalità protette non siano più accessibili.

### **User Story 6: Visualizzazione dei propri eventi proposti**

**Come** utente registrato **voglio** visualizzare gli eventi che ho proposto e il loro stato di approvazione **per** avere traccia delle mie attività e sapere se sono stati approvati o meno.

### **Criteri di accettazione:**

* Solo l’utente autenticato può visualizzare i propri eventi proposti.  
* Gli eventi vengono mostrati in una sezione dedicata della pagina **Profilo**.  
* Se l’utente non ha ancora proposto alcun evento, viene mostrato un messaggio informativo invitando l’utente a pubblicare una proposta.  
* I dettagli degli eventi non sono modificabili da questa sezione.

### **TASKS – User Story 6:**

1. **Creare una sezione “Eventi proposti” nella pagina profilo**  
* Inserire una nuova sezione visibile solo all’utente autenticato nella pagina del profilo;  
2. **Collegare la sezione al backend per recuperare i dati**  
* Chiamare l’API che restituisce gli eventi creati dall’utente corrente, ordinati per data di creazione;  
* Verificare che vengano mostrati solo gli eventi dell’utente loggato, identificato tramite il token JWT.  
3. **Visualizzare le informazioni principali per ogni evento**  
* Mostrare in una card o lista per ciascun evento:  
  * Titolo evento  
  * Data e luogo  
    Data di proposta (creazione)  
  * Stato approvazione (es. badge colorato con testo: “In attesa”, “Approvato”, “Rifiutato”)  
* Mostrare in evidenza lo stato, con colori diversi per facilitarne l’identificazione.  
4. **Gestire il caso di lista vuota**  
* Se l’utente non ha ancora proposto eventi:  
  * Mostrare una card con messaggio che inviti l’utente a inserire una.  
  * Eventualmente aggiungere un pulsante per proporne uno.  
5. **Scrivere test per diverse situazioni utente**  
* Profilo con più eventi in vari stati;  
* Profilo con nessun evento proposto;  
* Errore nella risposta dell’API (es. token scaduto);  
* Tentativo di accedere ai dati di un altro utente (verifica che il backend restituisca solo i propri).

### **User Story 7: Lista utenti seguiti**

**Come** utente registrato **voglio** visualizzare la lista degli utenti che seguo **per** gestire facilmente le mie iscrizioni e tener traccia delle persone o enti di mio interesse.

### **Criteri di accettazione:**

* La funzionalità è accessibile solo da utenti autenticati.  
* La lista degli utenti seguiti è visibile in una sezione dedicata della pagina profilo.  
* Ogni utente seguito viene mostrato con:  
  * nome e cognome o nome ente;  
  * immagine del profilo (se presente);  
  * link al profilo pubblico;  
  * pulsante “Unfollow”.  
* Se l’utente non segue nessuno, viene mostrato un messaggio informativo.  
* Il sistema aggiorna in tempo reale la lista quando un utente viene rimosso.

### **TASKS – User Story 7:**

1. **Creare la sezione “Utenti seguiti” nella pagina profilo**  
* Aggiungere una sezione visibile solo all’utente autenticato;  
* Mostrare una griglia che mostra delle card con gli utenti seguiti;  
* Mettere a disposizione un collegamento per vedere il profilo dell’utente in una nuova pagina e un tasto “Unfollow”.  
2. **Recuperare dal backend la lista degli utenti seguiti**  
* Effettuare una chiamata API autenticata per ottenere la lista aggiornata;  
* Verificare la sessione prima dell’accesso alla pagina.  
3. **Visualizzare i dati principali per ogni utente**  
* Mostrare:  
  * Nome visualizzato;  
  * Immagine del profilo (o eventuale placeholder se assente);  
  * Link al profilo pubblico (apre in nuova pagina);  
  * Pulsante “Unfollow”.  
4. **Implementare la funzionalità “Smetti di seguire”**  
* Al click del pulsante:  
  * Chiamare l’API di rimozione dell’iscrizione;  
  * Aggiornare l’interfaccia in tempo reale rimuovendo l’utente dalla lista.  
5. **Gestire il caso in cui non si seguono utenti**  
* Se la lista è vuota, mostrare una card con messaggio tipo:  
  * “Non stai seguendo nessun utente al momento.”  
  * Eventualmente, link suggerito: “Scopri utenti da seguire”.  
6. **Scrivere test per i casi d’uso principali**  
* Lista popolata correttamente;  
* Lista vuota;  
* Click su “Smetti di seguire” e aggiornamento UI;  
* Errori di rete o token scaduto.

### **User Story 8: Accesso alle impostazioni**

**Come** utente registrato **voglio** accedere alla pagina delle impostazioni **per** gestire le mie preferenze e modificare i dati del mio account.

### **Criteri di accettazione:**

* Il link alle impostazioni è visibile e accessibile solo se l’utente è autenticato, e si trova nella pagina del suo profilo personale, con un pulsante a forma di ingranaggio..  
* La pagina impostazioni raccoglie in un unico luogo le funzionalità di modifica del profilo e delle credenziali.  
* La struttura della pagina è chiara e suddivisa in sezioni (es. "Dati profilo", "Credenziali di accesso").

### **TASKS – User Story 8:**

1. **Aggiungere il collegamento alle impostazioni nell’interfaccia utente**  
* Posizionare il pulsante dell’ingranaggio nella pagina del profilo.  
* Visibile solo per utenti autenticati.  
2. **Creare la pagina impostazioni con struttura a sezioni**  
* Suddividere visivamente la pagina in aree distinte (profilo / credenziali);  
* Ogni area include i form e i relativi pulsanti di modifica.  
3. **Proteggere la rotta e validare accessi**  
* Consentire l’accesso alla pagina solo ad utenti loggati con token JWT valido;  
* Gestire eventuali redirect in caso contrario.  
4. **Scrivere test di accesso e visualizzazione pagina**  
* Accesso da utente autenticato;  
* Accesso negato da utente non loggato;  
* Presenza delle due sezioni principali.

### **User Story 9: Modifica dati profilo**

**Come** utente registrato **voglio** modificare i miei dati personali (nome, cognome, email, biografia, foto) **per** mantenere aggiornato il mio profilo sulla piattaforma.

### **Criteri di accettazione:**

* L’utente può modificare solo i propri dati.  
* Il form contiene i seguenti campi: nome, cognome, email, biografia, foto profilo.  
* Ogni campo ha una validazione (es. formato email corretto, limite di caratteri per la biografia).  
* Dopo il salvataggio, i dati aggiornati vengono mostrati nel profilo pubblico e nel profilo personale.

### **TASKS – User Story 9:**

1. **Creare il form per la modifica dei dati profilo**  
* Campi editabili: nome, cognome, email, biografia (max 500 caratteri), immagine profilo (upload);  
* I campi devono essere precompilati con i dati attuali dell’utente.  
2. **Gestire l’upload e anteprima della nuova immagine profilo**  
* Consentire selezione file da dispositivo e mostrare un'anteprima;  
* Validare estensione e dimensione massima del file.  
3. **Implementare validazioni lato frontend e backend**  
* Controlli su:  
  * email valida e non già in uso;  
  * biografia opzionale ma con limite;  
  * nome e cognome non vuoti.  
4. **Gestire salvataggio modifiche e messaggi di esito**  
* Mostrare notifica di “Salvataggio riuscito” oppure messaggio di errore dettagliato;  
* Aggiornare in tempo reale i dati visibili nel profilo.  
5. **Scrivere test di modifica dati profilo**  
* Modifica riuscita;  
* Upload immagine;  
* Errori di validazione;  
* Form vuoto o dati invalidi.

### **User Story 10: Gestione credenziali di accesso**

**Come** utente registrato **voglio** gestire le mie credenziali di accesso **per** cambiare la password o collegare/disconnettere il mio account Google.

### **Criteri di accettazione:**

* La sezione è adattiva in base al metodo di registrazione:  
  * Utenti registrati via Google possono impostare una password;  
  * Utenti con credenziali locali possono collegare un account Google.  
* Ogni operazione richiede conferma da parte dell’utente e restituisce un messaggio di esito.  
* Le operazioni non devono disconnettere l’utente.

### **TASKS – User Story 10:**

1. **Mostrare le opzioni corrette in base al tipo di autenticazione**  
* Se l’utente ha account Google: Mostrare form per impostare nuova password.  
* Se l’utente ha credenziali locali: Mostrare pulsante per **c**ollegare un account Google.

2. **Implementare il form di modifica/creazione password**  
* Campi richiesti: nuova password, conferma password;  
* Validazioni su lunghezza, sicurezza, match tra i due campi.  
3. **Gestire la connessione/disconnessione di Google OAuth**  
* Consentire il collegamento account Google via popup di autorizzazione;  
* Salvataggio del token e conferma dell'avvenuto collegamento.  
4. **Gestire i messaggi di successo o errore**  
* Mostrare notifiche chiare all’utente in ogni caso (es. “Password aggiornata con successo”, “Errore durante la connessione a Google”).  
5. **Scrivere test per tutte le combinazioni possibili**  
* Impostazione nuova password da utente Google;  
* Collegamento account Google per utente con credenziali locali;  
* Errori nei form;  
* Ripetizione della stessa operazione (es. account già collegato).

### **User Story 11: Profilo degli utenti**

**Come** utente della piattaforma **voglio** visualizzare il profilo pubblico di un altro utente **per** informarmi su di lui e vedere le sue proposte approvate.

### **Criteri di accettazione:**

* Il profilo pubblico ha lo stesso layout del profilo personale, ma:  
  * mostra solo proposte approvate dell’utente visualizzato;  
  * non include elementi di modifica o impostazioni.  
* Sono visibili i dati pubblici dell’utente:  
  * nome e cognome (o denominazione ente),  
  * immagine profilo,  
  * biografia  
* Le proposte sono mostrate con titolo, immagine (se presente).  
* Cliccando sulla card della proposta, si aprirà la pagina corrispondente della proposta.  
* Se l’utente non ha proposte approvate, viene mostrato un messaggio informativo.  
* La visualizzazione è accessibile anche a utenti non autenticati.

### **TASKS – User Story 11:**

1. **Creare la pagina “Profilo pubblico” per altri utenti**  
* Utilizzare il layout del profilo personale come base;  
* Rimuovere pulsanti di modifica e impostazioni;  
2. **Recuperare i dati pubblici dell’utente dal backend**  
* Scrivere gli endpoint API per ottenere: nome, cognome/denominazione, immagine, biografia, lista proposte approvate;  
* Gestire caricamento e stato di errore.  
3. **Visualizzare solo le proposte approvate**  
* Filtrare per mostrare esclusivamente eventi con stato “approvato”;  
* Ordinare le proposte in ordine cronologico inverso (più recente in alto)  
4. **Gestire il caso di assenza proposte**  
* Mostrare messaggio che avvisa che l’utente non ha ancora pubblicato nessuna proposta.  
5. **Linkare ogni proposta alla relativa pagina evento**  
* Il click sul titolo o immagine apre la scheda evento in una nuova pagina.  
6. **Scrivere test di visualizzazione profilo pubblico**  
* Profilo con proposte approvate;  
* Profilo senza proposte;  
* Errori di caricamento dati;  
* Accesso da utente loggato e non loggato.

### **User Story 12: Lista eventi “hyped”**

**Come** utente registrato **voglio** visualizzare la lista delle proposte a cui ho messo hype **per** poter gestire e monitorare le valutazioni che ho inserito.

### **Criteri di accettazione:**

* La lista è visibile dalla pagina del mio profilo, in una sezione dedicata.  
* Ogni elemento della lista mostra:  
  * titolo della proposta,  
  * descrizione della proposta;  
  * immagine (se presente),  
  * pulsante o icona per rimuovere l’hype.  
* Se non ci sono eventi hyped, mostra un messaggio che avvisa che non sono ancora stati inseriti hype.  
* L’accesso a questa sezione è consentito solo all’utente autenticato proprietario del profilo.

### **TASKS – User Story 12:**

1. **Aggiungere sezione “Eventi hyped” nel profilo personale**  
   * Posizionare la sezione in un tab dedicato o sotto le altre liste del profilo;  
   * Titolo chiaro: “Eventi a cui hai messo hype”.  
2. **Creare API per recupero eventi hyped**  
   * Endpoint per ottenere tutte le proposte a cui l’utente ha messo hype;  
   * Restituire informazioni essenziali (id, titolo, immagine, autore, stato approvazione, data hype).  
3. **Visualizzare gli eventi in lista**  
   * Visualizzare le card complete con gli elementi base della proposta.  
4. **Implementare rimozione hype**  
   * Aggiungere pulsante “Unhype” per la rimozione dell’hype per ogni card proposta.  
5. **Gestire stati particolari**  
   * In caso di nessun evento hyped mostra messaggio informativo.  
6. **Testare funzionalità**  
   * Recupero lista eventi hyped;  
   * Ordinamento corretto;  
   * Rimozione hype singolo evento;  
   * Visualizzazione messaggio in assenza di eventi.

### **User Story 13: Rimozione di una mia proposta**

**Come** utente autenticato **voglio** poter rimuovere una delle mie proposte visibili nella pagina del mio profilo **per** gestire e mantenere aggiornato l’elenco degli eventi/proposte che ho pubblicato.

### **Criteri di accettazione:**

1. L’utente può rimuovere solo proposte di cui è autore.  
2. La rimozione è avviabile dalla pagina del profilo, nella sezione “Le mie proposte”.  
3. Prima della rimozione definitiva, il sistema richiede una conferma tramite finestra di dialogo.  
4. Dopo la conferma, la proposta viene eliminata dal database e non è più visibile pubblicamente né all’utente.  
5. Se l’operazione fallisce (problemi di connessione o permessi), l’utente riceve un messaggio di errore chiaro.  
6. Dopo una rimozione riuscita, la lista delle proposte dell’utente si aggiorna senza ricaricare l’intera pagina.

### **TASKS – User Story 13:**

1. **Aggiornare la pagina profilo – sezione “Le mie proposte”**  
* Visualizzare le proposte create dall’utente in una lista o griglia;  
* Aggiungere, per ogni proposta, un pulsante o icona “Elimina”;  
* Assicurarsi che il pulsante sia visibile solo all’autore.  
2. **Implementare la conferma di eliminazione**  
* Mostrare un popup di conferma con testo chiaro;  
* Offrire opzioni di conferma e annullamento;  
* Chiudere il popup in caso di annullamento.  
3. **Gestire la richiesta di eliminazione verso il backend**  
* Creare endpoint protetto accessibile solo all’autore;  
* Inviare la richiesta con autenticazione (JWT);  
* Gestire eventuali errori (id inesistente, permesso negato, errore server).  
4. **Aggiornare l’interfaccia dopo l’eliminazione**  
* Rimuovere la proposta dalla lista in tempo reale.  
5. **Gestire messaggi di errore**  
* Per permessi non sufficienti;  
* Per proposta non esistente;  
* Per eventuali errori di connessione;  
6. **Scrivere test per i casi di rimozione**  
* Eliminazione riuscita di una proposta propria;  
* Tentativo di eliminare una proposta di un altro utente (bloccato);  
* Gestione di errori di rete o server;  
* Verifica che la lista si aggiorni dopo eliminazione.

### **User Story 14: Visualizzazione delle proposte nella home page**

**Come** utente **voglio** vedere tutte le anteprime delle proposte approvate **per** poter scoprire le iniziative disponibili sulla piattaforma.

**Criteri di accettazione**

* La lista mostra solo le proposte con stato “Approvata”.  
* Le proposte sono ordinate per data di pubblicazione, dalla più vecchia alla più recente.  
* Ogni proposta mostra: titolo, immagine di copertina (se presente), categoria, data, luogo, breve descrizione.  
* La visualizzazione è accessibile sia da utenti autenticati che non autenticati.  
* Se non ci sono proposte approvate, viene mostrato un messaggio informativo.

**TASKS – User Story 14:**

1. **Implementare la sezione nuove proposte nella home page**  
* Creare una sezione dedicata nella home page con all’interno una griglia  
* Strutturare le card delle proposte, ovvero le anteprime delle proposte, con l’immagine e le informazioni principali elencate precedentemente  
2. **Gestione immagine di fallback**  
* Implementare una logica che verifichi se il campo immagine è vuoto o il caricamento fallisce  
* In tal caso, mostrare un’immagine placeholder predefinita  
3. **Gestione stati vuoti e caricamento**  
* Visualizzare un loader animato durante il recupero dei dati  
* Mostrare il messaggio “Nessuna proposta disponibile” se la risposta è vuota  
4. **Test di visualizzazione**  
* Verificare il corretto caricamento con elenco pieno, elenco vuoto, errore di rete, immagine mancante

### **User Story 15: Filtraggio proposte**

**Come** utente **voglio** filtrare le proposte per categoria e/o città **per** trovare quelle di mio interesse.

**Criteri di accettazione**

* È possibile combinare più filtri contemporaneamente  
* I risultati devono aggiornarsi senza ricaricare l’intera pagina  
* Se non ci sono proposte che soddisfano i criteri, viene mostrato un messaggio di avviso

**TASKS – User Story 15:**

1. **Aggiunta UI dei filtri**  
* Inserire il pulsante dedicato ai filtri nella home page  
* Inserire un menù a tendina per selezionare una categoria  
* Inserire un campo input per aggiungere una città  
2. **Logica di filtraggio**  
* Applicare i filtri lato backend tramite query API  
* Aggiornare la lista proposte in tempo reale senza refresh completo della pagina  
3. **Gestione casi speciali**  
* Mostrare tutte le proposte approvate se  nessun filtro è selezionato   
* Mostrare un messaggio se i filtri selezionati restituiscono una lista vuota  
4. **Test dei filtri**  
* Gestione di: filtri singoli, combinati, nessun filtro e risultati vuoti

### **User Story 16: Commentare una proposta**

**Come** utente registrato **voglio** commentare una proposta di un altro utente **per** condividere il mio parere.

**Criteri di accettazione**

* Solo utenti autenticati possono commentare  
* Ogni commento mostra autore, testo  
* I commenti sono visibili a tutti, ma cancellabili solo dal loro autore e dagli operatori

**TASKS – User Story 16:**

1. **Creare la sezione per l’inserimento di un commento**  
* La sezione comprende: un campo input per inserire il testo del commento, un pulsante di invio e una lista composta da tutti i commenti già inseriti dagli altri utenti  
2. **Integrazione con backend**  
* Collegare il pulsante di invio a un’API autenticata per salvare il commento  
* Aggiornare la lista dei commenti dopo l’inserimento senza ricaricare la pagina  
3. **Funzioni di modifica ed eliminazione**  
* Mostrare il pulsante “Elimina” solo per l’autore del commento e gli operatori  
4. **Gestione dei casi limite**  
* Visualizzare a schermo un messaggio nel caso in cui una proposta non abbia commenti pregressi  
5. **Testare le funzionalità**

### **User Story 17: Visualizzazione della classifica**

**Come** utente **voglio** visualizzare la classifica delle proposte **per** vedere quelle con il maggior numero di hype

**Criteri di accettazione**

* La classifica mostra le proposte ordinate per numero di hype, dal più alto al più basso  
* Ogni riga mostra posizione, titolo, descrizione, categoria e numero di hype  
* È accessibile anche agli utenti non autenticati  
* A parità di hype viene visualizzata la proposta più recente

**TASKS – User Story 17:**

1. **Creazione della pagina dedicata**  
* Inserire nel toggle la possibilità di accedere alla classifica  
2. **Collegamento dati**  
* API per recuperare proposte con stato “Approvata” e conteggio hype  
* Ordinamento lato backend con fallback frontend  
3. **Testare la pagina**  
* Verificare che l’ordinamento sia corretto, anche a parità di Hype

### **User Story 18: Aggiunta di Hype a una proposta**

**Come** utente registrato **voglio** aggiungere un hype a una proposta **per** sostenerla.

**Criteri di accettazione**

* Solo utenti autenticati possono aggiungere hype  
* Un utente può aggiungere hype a una proposta una sola volta  
* Il numero di hype si aggiorna in tempo reale  
* Se l’utente ha già messo hype, il pulsante appare in stato “già messo”.  
* Se si clicca una seconda volta il pulsante l’hype viene tolto

**TASKS – User Story 18:**

1. **Inserire il pulsante nella pagina della proposta**  
* Inserire il pulsante nelle pagina della proposta  
* Cambiare lo stato del pulsante se assegno l’hype  
2. **Integrazione con API**  
* Una volta inserito l’hype inserire l’utente nella lista degli hyper  
* Chiamare L’API per l’inserimento dell’hype.  
* Implementare l’aggiornamento immediato del conteggio sul frontend.  
3. **Test funzionalità hype**  
* Testare e gestire i casi limite come l’inserimento del primo hype o un hype da un utente non autenticato

### **User Story 19: Pagina della proposta**

**Come** utente **voglio** visualizzare i dettagli di una proposta **per** potermi informare meglio su di essa

**Criteri di accettazione**

* L’utente può aprire una pagina dedicata con tutte le informazioni di una proposta  
* La pagina mostra: titolo, autore (link al profilo), descrizione, immagine, luogo, data, categoria, numero di hype, commenti  
* La pagina è accessibile da tutti, anche ai non loggati  
* Da questa pagina l’utente può aggiungere hype o commenti (se autenticato)

**TASKS – User Story 19:**

1. **Creazione della pagina dedicata**  
* Creazione del layout compreso di informazioni, tasto di hype e sezione dei commenti  
2. **Recupero dei dati dal backend**  
* Implementazione dell’API da cui si ottengono tutti i dettagli della proposta  
3. **Test della pagina**  
* Verificare la corretta visualizzazione dei dati nel layout e la correttezza delle informazioni  
* Verificare l’utilizzo di immagini standard se mancanti

### **User Story 20: Ricerca di una proposta**

**Come** utente **voglio** cercare una proposta per parola chiave **per** trovare quelle di mio interesse

**Criteri di accettazione**

* L’utente può inserire una o più parole chiave in un campo di ricerca  
* La ricerca deve essere effettuata sul titolo e/o descrizione  
* I risultati vengono mostrati in lista con lo stesso layout della home  
* I risultati devono essere mostrati in un elenco aggiornato dinamicamente.  
* In caso di assenza di risultati, deve comparire un messaggio di avviso  
* La ricerca non deve essere sensibile a maiuscole/minuscole e deve supportare ricerche parziali

**TASKS – User Story 20:**

1. **Interfaccia di ricerca**  
* Aggiungere una sezione dedicata nella home page  
* Inserire la ricerca in tempo reale durante la digitazione  
2. **Implementare la logica di ricerca**  
3. **Visualizzazione dei risultati**  
* Il risultato della ricerca viene visualizzato sotto forma di elenco di anteprime di proposte  
4. **Gestione dei casi limite**  
* Se non si ottengono risultati della ricerca si visualizza un messaggio dedicato  
* Se la casella di input è vuota vengono visualizzate tutte le proposte  
5. **Test della ricerca**  
* Verificare la ricerca in caso di match parziale  
* Verificare il corretto funzionamento del non Case Sensitive  
* Verificare l’output in caso di ricerca senza risultati

### **User Story 21: Ricerca di un utente**

**Come** utente **voglio** cercare altri utenti registrati **per** informarmi sulle loro proposte

**Criteri di accettazione**

* La ricerca è disponibile nella stessa barra di ricerca delle proposte  
* I risultati mostrano: nome, immagine del profilo, biografia e link al profilo  
* La ricerca è disponibile sia per utenti loggati che non  
* Se la ricerca non ottiene risultati viene visualizzato un messaggio di avviso

**TASKS – User Story 21:**

1. **Interfaccia di ricerca**  
* Aggiungere una sezione dedicata nella home page  
* Inserire la ricerca in tempo reale durante la digitazione  
2. **Implementare la logica di ricerca**  
3. **Visualizzazione dei risultati**  
* Il risultato della ricerca viene visualizzato sotto forma di elenco di anteprime di profilo  
4. **Gestione dei casi limite**  
* Se non si ottengono risultati della ricerca si visualizza un messaggio dedicato  
* Se la casella di input è vuota non vengono visualizzati profili  
5. **Testare la ricerca**  
* Verificare la ricerca in caso di match parziale  
* Verificare il corretto funzionamento del non Case Sensitive  
* Verificare l’output in caso di ricerca senza risultati

### **User Story 22: Seguire un utente**

**Come** utente registrato **voglio** seguire un utente **per** rimanere aggiornato sulle sue proposte

**Criteri di accettazione**

* Solo utenti autenticati possono seguire altri utenti  
* Il pulsante “Segui” viene visualizzato nel profilo pubblico di altri utenti  
* Lo stato viene aggiornato in tempo reale: “Segui” se non si segue un determinato utente, “Smetti di seguire” se lo si segue  
* Non si può seguire sé stessi

**TASKS – User Story 22:**

1. **Creazione del pulsante “segui”**  
* Mostrare pulsante nel profilo pubblico di un utente.  
* Cambiare etichetta e stile in base allo stato attuale  
2. **Gestione vincoli**  
* Impedire follow verso se stessi  
* Impedire follow duplicati  
3. **Testare il follow**  
* Verificare la possibilità di seguire un utente  
* Verificare la possibilità di smettere di seguire un utente  
* Verificare di non potersi seguire da soli

User story 23 geki: inserisci proposta.

**User Story 24: Visualizzazione dati sulle proposte pubblicate**

**Come** operatore **voglio** visualizzare dati utili sulle proposte pubblicate nell’app **per** avere una panoramica sulle proposte e i relativi hype.

**Criteri di accettazione:**

* L’operatore deve poter accedere a una dashboard con i dati aggregati delle proposte pubblicate.  
* Devono essere mostrati almeno i seguenti dati:  
  * Numero di proposte in attesa di approvazione.  
  * Numero di proposte approvate.  
  * Numero di proposte rifiutate.  
  * Classifica delle proposte più hypate (con nome proposta, descrizione e numero di hype ricevuti).  
* L’accesso a questa dashboard deve essere limitato solo agli operatori autenticati.

**TASKS – User Story 24:**

1. **Creare la sezione dashboard per gli operatori**  
   * Aggiungere voce di menu o pulsante “Pannello Operatore” visibile solo agli utenti con ruolo operatore.  
   * Proteggere la pagina con controllo di autenticazione e autorizzazione lato frontend e backend.  
   * Reindirizzare l’utente alla pagina di login se non è operatore oppure se è autenticato con un account non operatore;  
2. **Implementare API per recupero dati aggregati**  
   * Scrivere endpoint protetto per ottenere i contatori delle proposte in attesa, approvate e rifiutate.  
   * Scrivere endpoint protetto per ottenere la classifica delle proposte più hypate, ordinata per numero di hype decrescente (classifica).  
3. **Progettare il layout della dashboard**  
   * Sezione statistiche generali con i contatori delle proposte (attesa/approvate/rifiutate).  
   * Sezione classifica con elenco ordinato e numero di hype accanto.  
4. **Implementare gestione errori e fallback**  
   * Messaggio in caso di errore nel recupero dei dati.  
   * Gestione di scenari con dati vuoti.

**User Story 25: Moderazione proposte in attesa**

**Come** operatore **voglio** vedere le proposte in attesa **per** approvarle o scartarle in base alla loro conformità alle linee guida della piattaforma.

**Criteri di accettazione:**

* L’operatore deve poter visualizzare tutte le proposte in stato “In attesa” in un’unica pagina dedicata.  
* Ogni proposta deve mostrare:  
  * Titolo  
  * Descrizione  
  * Categoria  
  * Data  
  * Luogo  
  * Eventuale immagine associata  
  * Stato attuale (“In attesa”)  
* L’operatore deve avere la possibilità di:  
  * Visualizzare i **dettagli completi** della proposta prima di decidere.  
  * **Approvare** una proposta (cambia lo stato a “Approvata” e la rende pubblica).  
  * **Rifiutare** una proposta (cambia lo stato a “Rifiutata” e la rimuove dal flusso pubblico).  
* L’interfaccia deve mostrare il numero totale di proposte in attesa.  
* Solo gli operatori autenticati possono accedere alla pagina di moderazione.

**TASKS – User Story 25:**

1. **Creare la pagina di moderazione proposte**  
   * Accessibile solo dal pannello operatore.  
   * Mostrare un contatore con il numero totale di proposte in attesa.  
   * Implementare la lista/card delle proposte con dati principali e pulsanti di azione.  
2. **Implementare API di recupero proposte in attesa**  
   * Endpoint protetto che restituisce tutte le proposte con stato “In attesa”.  
3. **Implementare API di aggiornamento stato proposta**  
   * Endpoint protetto per approvare una proposta (cambia stato a “Approvata”).  
   * Endpoint protetto per rifiutare una proposta (cambia stato a “Rifiutata”).  
   * Restituire messaggi di conferma o errore.  
4. **Gestire le azioni dal frontend**  
   * Collegare i pulsanti “Approva” e “Rifiuta” agli endpoint corrispondenti.  
   * Aggiornare dinamicamente la lista dopo ogni azione, senza ricaricare la pagina.  
5. **Implementare side banner dettagli proposta**  
   * Accessibile dal pulsante “Dettagli” presente nella card.  
   * Mostrare tutte le informazioni disponibili della propost.  
6. **Gestione errori e fallback**  
   * Messaggio in caso di impossibilità a caricare le proposte.  
   * Conferma visiva dell’azione eseguita.

**User Story 26: Contrassegnare evento come finanziato**

**Come** operatore **voglio** contrassegnare un evento come finanziato **per** indicare che la proposta riceverà il supporto del comune.

**Criteri di accettazione:**

* Solo le proposte approvate possono essere contrassegnate come finanziate.  
* L’operatore deve poter eseguire l’azione da:  
  * La lista delle proposte approvate.  
  * La pagina dettagli di una singola proposta.  
* Una proposta finanziata deve essere chiaramente indicata con un badge o un’etichetta “Finanziata” visibile agli utenti.  
* Lo stato “Finanziata” deve essere salvato nel database.  
* È possibile rimuovere lo stato di “Finanziata” in caso di errore o cambiamento di decisione.  
* Solo operatori autenticati e autorizzati possono eseguire questa operazione.

**TASKS – User Story 26:**

1. **Aggiungere pulsante “Segna come finanziata”**  
   * Mostrare il pulsante solo per proposte approvate e non già finanziate.  
   * Il pulsante deve essere disponibile nella lista e nella pagina dettagli proposta.  
2. **Implementare API per aggiornare lo stato di finanziamento**  
   * Endpoint protetto che imposta lo stato di finanziato per una proposta.  
   * Endpoint per rimuovere il finanziamento in caso di problemi.  
   * Restituire conferma o messaggio d’errore.  
3. **Aggiornare il modello dati**  
   * Aggiungere l’opzione “Finanziata” all’interno del modello dello stato proposta (che è embed all’interno di quest’ultima).  
4. **Aggiornare UI con indicatore “Finanziata”**  
   * Badge o etichetta colorata visibile accanto al titolo nelle liste e nei dettagli.  
   * Aggiornamento della UI dopo l’azione dell’operatore.  
5. **Gestire errori e conferme**  
   * Notifica di conferma che la proposta è stata contrassegnata come finanziata.  
   * Messaggio di errore in caso di problemi con l’aggiornamento dello stato.

**User Story 27: Eliminazione proposta idonea**

**Come** operatore **voglio** eliminare una proposta già pubblicata come idonea **per** poter intervenire in caso di problemi o violazioni delle linee guida.

**Criteri di accettazione:**

* Solo le proposte con stato “Approvata” (idonea alla pubblicazione) possono essere eliminate.  
* L’eliminazione deve rimuovere la proposta dalla visualizzazione pubblica per tutti gli utenti.  
* L’operazione deve essere irreversibile a livello di visibilità pubblica, ma i dati storici devono rimanere nel database per motivi di audit.  
* L’operatore deve confermare l’eliminazione tramite un messaggio di conferma (“Sei sicuro di voler eliminare questa proposta?”).  
* L’azione deve essere eseguibile sia dalla lista delle proposte pubblicate che dalla pagina dei dettagli.  
* Solo operatori autenticati e autorizzati possono eseguire questa operazione.

**TASKS – User Story 27:**

1. **Aggiungere pulsante “Elimina proposta”**  
   * Mostrare solo per proposte in stato “Approvata” (idonea).  
   * Presente sia nella lista proposte approvate che nella pagina dettagli.  
2. **Implementare side banner di conferma**  
   * Messaggio chiaro che avvisa della rimozione permanente dalla visibilità pubblica.  
   * Pulsanti “Conferma” e “Annulla”.  
3. **Implementare API di eliminazione proposta**  
   * Endpoint protetto che imposta la proposta in modo che non sia più visibile dagli utenti, senza cancellare i dati dal database.  
   * Aggiornamento immediato dell’interfaccia lato frontend dopo conferma.  
4. **Aggiornare il modello dati**  
   * Aggiungere l’opzione “Nascosta” all’interno del modello dello stato proposta (che è embed all’interno di quest’ultima).  
   * Garantire che le API pubbliche non restituiscano proposte nascoste.  
5. **Aggiornare UI dopo eliminazione**  
   * Rimuovere la proposta dalla lista pubblicata.  
   * Mostrare notifica di conferma (“Proposta eliminata con successo”).  
6. **Gestire errori e permessi**  
   * Messaggio di errore in caso di problemi con l’API o di proposta inesistente.

**User Story 28: Visualizzazione elenco utenti**

**Come** operatore o amministratore **voglio** visualizzare l’elenco degli utenti registrati **per** poter monitorare e gestire la community in modo efficace.

**Criteri di accettazione:**

* L’elenco deve mostrare tutti gli utenti registrati alla piattaforma.  
* Per ogni utente devono essere visibili tutti i dati (ad esclusione della password)  
* Deve essere possibile accedere ai dettagli di un singolo utente per visualizzare informazioni aggiuntive.  
* L’accesso a questa funzionalità deve essere riservato solo a operatori e amministratori autenticati.

**TASKS – User Story 28:**

1. **Creare la pagina elenco utenti**  
   * Accessibile solo da operatori e amministratori.  
   * Mostrare cards con dati dell’utente.  
2. **Implementare funzioni di ordinamento e filtro**  
   * Ordinamento per nome, data di registrazione ed email.  
   * Filtri per ruolo (utenti privati o enti).  
3. **Implementare API per recuperare l’elenco utenti**  
   * Endpoint protetto che restituisce tutti gli utenti con le informazioni principali.  
   * Supporto a parametri per filtraggio e ordinamento.  
4. **Aggiungere collegamento ai dettagli utente**  
   * Cliccando su un utente si apre una pagina o un pannello con le informazioni complete del profilo.  
5. **Gestire errori e messaggi informativi**  
   * Mostrare un messaggio se non ci sono utenti corrispondenti ai filtri.  
   * Notifica di errore in caso di problemi di caricamento dati.

**User Story 29: Contatto utenti via email**

**Come** operatore o amministratore **voglio** contattare gli utenti via email direttamente dalla piattaforma **per** informarli rapidamente su eventuali novità o comunicazioni ufficiali.

**Criteri di accettazione:**

* L’operatore o l’amministratore deve poter avviare l’invio di un’email cliccando su un pulsante presente nella scheda o nell’elenco utenti.  
* Il clic sul pulsante deve aprire il gestore di posta predefinito del dispositivo.  
* L’indirizzo email del destinatario deve essere precompilato con quello dell’utente selezionato.  
* L’oggetto dell’email deve essere automaticamente impostato su: **"Comunicazione dalla piattaforma InCrowd"**.  
* Il corpo dell’email può essere lasciato vuoto, in modo che l’operatore o amministratore possa scrivere liberamente il contenuto.  
* La funzionalità deve essere disponibile solo a operatori e amministratori autenticati.

**TASKS – User Story 29:**

1. **Aggiungere pulsante “Invia email” nella UI**  
   * Pulsante visibile nella lista utenti e nella pagina dei dettagli di un utente.  
   * Mostrare il pulsante solo a operatori e amministratori autenticati.  
2. **Configurare apertura del client email predefinito**  
   * Utilizzare il protocollo mailto: per aprire il gestore di posta del dispositivo.  
   * Precompilare l’indirizzo email del destinatario con quello dell’utente selezionato.  
   * Impostare automaticamente l’oggetto a “Comunicazione dalla piattaforma InCrowd”.  
3. **Verificare compatibilità cross-device**  
   * Testare la funzionalità su diversi browser e sistemi operativi per assicurarsi che il client email si apra correttamente.

**User Story 30: Gestione elenco operatori**

**Come** amministratore **voglio** visualizzare l’elenco degli operatori **per** poter monitorare e gestire i loro account, assegnando o revocando il ruolo di operatore quando necessario.

**Criteri di accettazione:**

* Solo l’amministratore può accedere a questa lista.  
* La lista deve mostrare tutti gli utenti che hanno il ruolo di operatore.  
* Per ogni operatore devono essere visibili almeno:  
  * Nome e cognome;  
  * Indirizzo email.  
* L’amministratore deve poter:  
  * Aggiungere un nuovo operatore inserendo i suoi dati (nome, cognome, email) ed una password sicura.  
  * Revocare il ruolo di operatore a un utente già presente nella lista.  
* Le modifiche devono essere immediatamente visibili nella lista.  
* L’inserimento di un nuovo operatore non avviene se quella email è già in uso da un utente privato o ente.  
* L’operatore se possiede un account Google con la mail con la quale viene registrato, potrà accedere anche in modalità oAuth.

**TASKS – User Story 30:**

1. **Creare la pagina elenco operatori**  
   * Accessibile solo all’amministratore.  
   * Tabella con le informazioni principali degli operatori.  
2. **Implementare API per recupero elenco operatori**  
   * Endpoint protetto che restituisce solo utenti con ruolo “operatore”.  
3. **Aggiungere funzionalità di gestione ruoli**  
   * Pulsante “Aggiungi operatore” per aggiungere i dettagli di un nuovo operatore (nome, cognome, email e password) e assegnargli il ruolo.  
   * Pulsante “Rimuovi ruolo operatore” per revocare il ruolo a un utente.  
4. **Aggiornare la UI in tempo reale dopo le modifiche**  
   * Dopo ogni azione, aggiornare la lista senza ricaricare manualmente la pagina.  
5. **Gestire conferme e messaggi informativi**  
   * Mostrare finestra di conferma prima di rimuovere un operatore.  
   * Notifica di conferma in caso di assegnazione o revoca completata.  
   * Messaggio di errore in caso di problemi o permessi insufficienti.