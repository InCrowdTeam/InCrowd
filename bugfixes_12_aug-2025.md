# 🔧 Bug Fixes - 12 Agosto 2025

## 📋 **Lista Bug da Risolvere**

### ✅ Completati
- [x] **Bug #3**: Scritta "proposta da altro utente" in proposte hyped
- [x] **Bug #4**: Filtro "solo operatori" nella UserList
- [x] **Bug #1**: Tasto cancellazione commenti mancante
- [x] **Bug #7**: Validazione lunghezza commenti (max 500 caratteri)
- [x] **Bug #11**: Validazione file upload (max 5MB)
- [x] **Bug #2**: Modal conferma eliminazione proposta mancante
- [ ] **Bug #6**: Impostazione password nelle impostazioni profilo
- [ ] **Bug #9**: Gestione errori inconsistente
- [ ] **Bug #10**: Cache avatar non invalidata
- [ ] **Bug #13**: Gestione sessione scaduta inconsistente

---

## 📝 **Dettaglio Modifiche**

### 🎯 **Approccio**
- Modifiche minimali e non impattanti
- Funzioni semplici per MVP
- Nessun fronzolo o complessità aggiuntiva
- Compatibilità con codice esistente

---

## 📝 **Dettaglio Modifiche**

### ✅ **Bug #3**: Scritta "proposta da altro utente" rimossa
**File**: `frontend/src/views/ProfiloView.vue`
**Modifica**: Sostituita la scritta "Proposta da altro utente" con la data di creazione nella sezione proposte hyped per coerenza con le altre sezioni.

**Prima**:
```vue
<span class="proposal-author">Proposta da altro utente</span>
```

**Dopo**:
```vue
<span class="proposal-date">
  {{ new Date(proposta.createdAt).toLocaleDateString('it-IT') }}
</span>
```

### ✅ **Bug #4**: Filtro "solo operatori" rimosso dalla UserList
**File**: `frontend/src/views/UserList.vue`
**Modifica**: Rimossa l'opzione "Solo operatori" dal filtro della lista utenti, mantenendo solo utenti normali ed enti.

**Prima**:
```vue
<option value="operatore">Solo operatori</option>
```

**Dopo**: Opzione rimossa completamente.

---

## Bug #1: Tasto cancellazione commenti ✅ COMPLETATO

**Descrizione**: Mancava il tasto per cancellare i commenti nella pagina proposta

**Soluzione**: Implementata funzionalità di cancellazione commenti con controlli di autorizzazione

### Backend (propostaController.ts)
```typescript
// Nuovo endpoint per eliminare commenti
async function deleteCommento(req: Request, res: Response) {
  try {
    const { propostaId, commentoId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.ruolo;

    if (!userId) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    const proposta = await Proposta.findById(propostaId);
    if (!proposta) {
      return res.status(404).json({ message: "Proposta non trovata" });
    }

    const commentoIndex = proposta.commenti.findIndex((c: any) => c._id.toString() === commentoId);
    if (commentoIndex === -1) {
      return res.status(404).json({ message: "Commento non trovato" });
    }

    const commento = proposta.commenti[commentoIndex];
    
    // Solo il creatore del commento o operatori/admin possono eliminarlo
    const isOwner = commento.utente.toString() === userId;
    const isOperatoreOrAdmin = userRole === 'operatore' || userRole === 'admin';
    
    if (!isOwner && !isOperatoreOrAdmin) {
      return res.status(403).json({ message: "Non hai il permesso di eliminare questo commento" });
    }

    // Rimuovi il commento dall'array
    proposta.commenti.splice(commentoIndex, 1);
    await proposta.save();

    res.json({ message: "Commento eliminato con successo" });
  } catch (error: any) {
    console.error("Errore nell'eliminazione del commento:", error);
    res.status(500).json({ message: "Errore del server nell'eliminazione del commento" });
  }
}
```

### Routes (propostaRoutes.ts)
```typescript
// Rotta per eliminare un commento (solo il creatore o operatori/admin)
router.delete("/:propostaId/commenti/:commentoId", authMiddleware, deleteCommento as any);
```

### Frontend API (propostaApi.ts)
```typescript
export async function deleteCommento(propostaId: string, commentoId: string, token: string) {
  const res = await fetch(`${BASE_URL}/${propostaId}/commenti/${commentoId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nell\'eliminazione commento');
  }

  return res.json();
}
```

### Frontend Service (PropostaService.ts)
```typescript
static async eliminaCommento(propostaId: string, commentoId: string, token: string): Promise<void> {
  try {
    await deleteCommento(propostaId, commentoId, token);
  } catch (error: any) {
    console.error('Errore nell\'eliminazione del commento:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Sessione scaduta. Effettua nuovamente il login.');
    } else if (error.response?.status === 403) {
      throw new Error('Non hai il permesso di eliminare questo commento.');
    } else if (error.response?.status === 404) {
      throw new Error('Commento non trovato.');
    } else {
      throw new Error('Errore nell\'eliminazione del commento');
    }
  }
}
```

### Frontend View (PropostaView.vue)
```vue
<!-- Aggiunto pulsante cancellazione nell'header del commento -->
<div class="comment-actions">
  <span class="comment-date" :title="formatDateTime(commento.createdAt?.toString() || '')">
    {{ formatDate(commento.createdAt?.toString() || '') }}
  </span>
  <button 
    v-if="canDeleteComment(commento)"
    @click="eliminaCommento(commento._id)"
    class="delete-comment-btn"
    title="Elimina commento"
  >
    🗑️
  </button>
</div>
```

```typescript
// Funzione per verificare permessi di cancellazione
function canDeleteComment(commento: any): boolean {
  if (!userStore.user) return false;
  
  // L'utente può cancellare il proprio commento
  if (commento.utente?._id === userStore.user._id) return true;
  
  // Gli operatori e admin possono cancellare qualsiasi commento
  if (userStore.isOperatore || userStore.isAdmin) return true;
  
  return false;
}

// Funzione per eliminare commento con conferma
async function eliminaCommento(commentoId: string) {
  if (!proposta.value || !userStore.token || !commentoId) return;
  
  if (!confirm("Sei sicuro di voler eliminare questo commento?")) return;
  
  try {
    await PropostaService.eliminaCommento(
      proposta.value._id,
      commentoId,
      userStore.token
    );
    
    // Ricarica i commenti per aggiornare la lista
    await caricaCommenti();
  } catch (err: any) {
    console.error("Errore eliminazione commento:", err);
    alert(err.message || "Errore nell'eliminazione del commento");
  }
}
```

**Funzionalità**: 
- ✅ Pulsante cancellazione visibile solo al creatore del commento e agli operatori/admin
- ✅ Conferma prima dell'eliminazione 
- ✅ Controlli di autorizzazione su backend
- ✅ Gestione errori con messaggi user-friendly
- ✅ Aggiornamento automatico della lista commenti dopo cancellazione

---

## Bug #7: Validazione lunghezza commenti ✅ COMPLETATO

**Descrizione**: I commenti non avevano limite di caratteri, causando potenziali problemi di layout e database

**Soluzione**: Implementato limite di 500 caratteri sia frontend che backend

### Backend (propostaController.ts)
```typescript
async function aggiungiCommento(req: Request, res: Response) {
  try {
    const { propostaId } = req.params;
    const { contenuto } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    // Validazione contenuto commento
    if (!contenuto || contenuto.trim().length === 0) {
      return res.status(400).json({ message: "Il contenuto del commento è obbligatorio" });
    }

    if (contenuto.trim().length > 500) {
      return res.status(400).json({ message: "Il commento non può superare i 500 caratteri" });
    }

    // ... resto della logica
  }
}
```

### Frontend (PropostaView.vue)
```vue
<textarea
  v-model="nuovoCommento"
  :disabled="isLoading"
  placeholder="Scrivi un commento..."
  class="comment-textarea"
  rows="3"
  maxlength="500"
  @keydown.ctrl.enter="inviaCommento"
></textarea>
<div class="char-count">{{ nuovoCommento.length }}/500</div>
```

**Funzionalità**: 
- ✅ Limite 500 caratteri su frontend con contatore
- ✅ Validazione backend per sicurezza
- ✅ Attributo maxlength per prevenire input eccessivo
- ✅ Messaggio di errore chiaro se limite superato

---

## Bug #11: Validazione file upload ✅ COMPLETATO

**Descrizione**: Mancavano controlli di dimensione e tipo file per upload di immagini

**Soluzione**: Implementati controlli semplici per foto proposte e foto profilo (max 5MB, tipi supportati)

### Backend - Proposte (propostaController.ts)
```typescript
foto: req.file
  ? (() => {
      // Validazione semplice dell'immagine
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('Tipo di file non supportato. Usa JPEG, PNG o GIF.');
      }
      
      // Controllo dimensione massima 5MB
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (req.file.size > maxSize) {
        throw new Error('File troppo grande. Dimensione massima: 5MB');
      }
      
      // Usa l'immagine originale senza compressione
      return {
        data: req.file.buffer.toString('base64'),
        contentType: req.file.mimetype,
      };
    })()
  : undefined,
```

### Backend - Foto Profilo (userController.ts)
```typescript
if (req.file) {
  // Validazione semplice foto profilo
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json(errorResponse("Tipo di file non supportato. Usa JPEG, PNG o GIF."));
  }
  
  // Controllo dimensione massima 5MB
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (req.file.size > maxSize) {
    return res.status(400).json(errorResponse("File troppo grande. Dimensione massima: 5MB"));
  }
  
  // Usa l'immagine originale senza compressione
  user.fotoProfilo = {
    data: req.file.buffer.toString('base64'),
    contentType: req.file.mimetype,
  };
}
```

### Routes - Configurazione Multer
```typescript
// propostaRoutes.ts, userRoutes.ts, enteRoutes.ts
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo di file non supportato. Sono permessi solo JPEG, PNG, GIF e WebP.'));
    }
  }
});
```

**Funzionalità**: 
- ✅ Controllo dimensione massima 5MB per tutte le immagini
- ✅ Validazione tipi file supportati (JPEG, PNG, GIF, WebP)
- ✅ Doppio controllo: multer + controller per sicurezza
- ✅ Messaggi di errore chiari e specifici
- ✅ Nessuna compressione automatica (come richiesto)
- ✅ Esclusione foto Google (non validate)

---

## Bug #2: Modal conferma eliminazione proposta ✅ COMPLETATO

**Descrizione**: L'eliminazione delle proposte utilizzava un semplice confirm() del browser invece di un modal elegante

**Soluzione**: Implementato modal di conferma moderno con anteprima della proposta da eliminare

### Frontend (ProfiloView.vue)
```vue
<!-- Modal di conferma eliminazione proposta -->
<div v-if="showDeleteModal" class="modal-overlay" @click="annullaEliminazione">
  <div class="modal-content" @click.stop>
    <div class="modal-header">
      <h3>Conferma eliminazione</h3>
      <button class="modal-close-btn" @click="annullaEliminazione">×</button>
    </div>
    <div class="modal-body">
      <div class="warning-icon">⚠️</div>
      <p><strong>Sei sicuro di voler eliminare questa proposta?</strong></p>
      <div v-if="propostaToDelete" class="proposta-preview">
        <h4>"{{ propostaToDelete.titolo }}"</h4>
        <p class="proposta-desc">{{ propostaToDelete.descrizione }}</p>
      </div>
      <p class="warning-text">Questa azione non può essere annullata.</p>
    </div>
    <div class="modal-footer">
      <button class="modal-btn cancel-btn" @click="annullaEliminazione">
        Annulla
      </button>
      <button class="modal-btn delete-btn" @click="confermaEliminazione">
        🗑️ Elimina definitivamente
      </button>
    </div>
  </div>
</div>
```

```typescript
// Stati per il modal di cancellazione
const showDeleteModal = ref(false);
const propostaToDelete = ref<IProposta | null>(null);

// Funzione aggiornata per mostrare il modal
const rimuoviProposta = async (proposta: IProposta) => {
  // Usa il modal di conferma invece di confirm()
  propostaToDelete.value = proposta;
  showDeleteModal.value = true;
};

// Funzione per confermare l'eliminazione dal modal
const confermaEliminazione = async () => {
  if (!propostaToDelete.value) return;
  
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_BACKEND_URL}/api/proposte/${propostaToDelete.value._id}`,
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    );
    
    if (response.status === 200) {
      // Rimuovi la proposta dalla lista locale
      mieProposte.value = mieProposte.value.filter(p => p._id !== propostaToDelete.value!._id);
      alert("Proposta eliminata con successo!");
    }
  } catch (err: any) {
    console.error("Errore nella rimozione della proposta:", err);
    const errorMessage = err.response?.data?.message || "Errore nella rimozione della proposta";
    alert(errorMessage);
  } finally {
    // Chiudi il modal
    showDeleteModal.value = false;
    propostaToDelete.value = null;
  }
};

// Funzione per annullare l'eliminazione
const annullaEliminazione = () => {
  showDeleteModal.value = false;
  propostaToDelete.value = null;
};
```

**Funzionalità**: 
- ✅ Modal moderno e responsivo invece di confirm() nativo
- ✅ Anteprima della proposta da eliminare con titolo e descrizione
- ✅ Icona di warning e testo di avvertimento
- ✅ Pulsanti stilizzati per annullare o confermare
- ✅ Animazioni di entrata e uscita fluide
- ✅ Chiusura tramite overlay o pulsante X
- ✅ Gestione errori e feedback utente

---
