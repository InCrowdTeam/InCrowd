import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import Proposta from "../models/Proposta";
import Commento from "../models/Commento";

// Formattazione response standardizzata per le proposte
const successResponse = (data: any, message?: string) => ({
  success: true,
  data,
  ...(message && { message })
});

const errorResponse = (message: string, error?: any) => ({
  success: false,
  error: message,
  ...(error && { details: error })
});

export const getAllProposte = async (req: Request, res: Response) => {
  try {
    const proposte = await Proposta.find({"stato.stato": "approvata"})
      .sort({ createdAt: -1 }); // Ordina per data di creazione decrescente (più recenti prima)
    const proposteProcessate = proposte.map(p => {
      const obj = p.toObject();
      // se è ancora Buffer lo converto, altrimenti lascio la stringa
      if (obj.foto?.data && Buffer.isBuffer(obj.foto.data)) {
        obj.foto.data = obj.foto.data.toString('base64');
      }
      return obj;
    });
    res.json(successResponse(proposteProcessate));
  } catch (error) {
    console.error("Errore nel recupero proposte:", error);
    res.status(500).json(errorResponse("Errore interno del server"));
  }
};

export const getMyProposte = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log("🔍 Debug getMyProposte - req.user:", req.user);
    
    // Verifica che l'utente sia autenticato
    if (!req.user || !req.user.userId) {
      console.log("❌ Utente non autenticato in getMyProposte");
      return res.status(401).json(errorResponse("Utente non autenticato"));
    }

    console.log("🔍 Debug - User ID:", req.user.userId);

    // Recupera TUTTE le proposte dell'utente, indipendentemente dallo stato
    const proposte = await Proposta.find({ proponenteID: req.user.userId })
      .sort({ createdAt: -1 }); // Ordina per data di creazione (più recenti prima)
    
    console.log("🔍 Debug - Proposte trovate:", proposte.length);
    
    const proposteProcessate = proposte.map(p => {
      const obj = p.toObject();
      // se è ancora Buffer lo converto, altrimenti lascio la stringa
      if (obj.foto?.data && Buffer.isBuffer(obj.foto.data)) {
        obj.foto.data = obj.foto.data.toString('base64');
      }
      return obj;
    });
    
    console.log("✅ Inviando proposte:", proposteProcessate.length);
    res.json(successResponse(proposteProcessate));
  } catch (error) {
    console.error("❌ Errore nel recupero proposte utente:", error);
    res.status(500).json(errorResponse("Errore interno nel recupero delle proposte"));
  }
};

export const searchProposte = async (req: Request, res: Response) => {
  try {
    const { 
      q,           // query di ricerca generale
      categoria,   // filtro per categoria
      citta,       // filtro per città
      stato,       // filtro per stato (approvata, in_approvazione, rifiutata)
      sortBy,      // ordinamento (createdAt, listaHyper, titolo)
      sortOrder,   // direzione ordinamento (asc, desc)
      limit,       // limite risultati
      skip         // skip per paginazione
    } = req.query;

    // Costruzione del filtro di ricerca
    let filter: any = {
      "stato.stato": "approvata" // Mostra solo proposte approvate
    };

    // Ricerca testuale su titolo e descrizione
    if (q && typeof q === 'string') {
      filter.$or = [
        { titolo: { $regex: q, $options: 'i' } },
        { descrizione: { $regex: q, $options: 'i' } }
      ];
    }

    // Filtro per categoria
    if (categoria && typeof categoria === 'string') {
      filter.categoria = categoria;
    }

    // Filtro per città
    if (citta && typeof citta === 'string') {
      filter['luogo.citta'] = { $regex: citta, $options: 'i' };
    }

    // Filtro per stato - manteniamo sempre approvata come base
    // ma permettiamo ulteriori filtri solo se sono stati "validi"
    if (stato && typeof stato === 'string') {
      // Solo per admin/operatori: permettere di cercare anche altri stati
      // Per ora manteniamo solo "approvata"
      if (stato === 'approvata') {
        filter['stato.stato'] = stato;
      }
      // Se vuoi permettere la ricerca di altri stati, decommentare:
      // filter['stato.stato'] = stato;
    }

    // Costruzione dell'ordinamento
    let sort: any = {};
    if (sortBy && typeof sortBy === 'string') {
      switch (sortBy) {
        case 'createdAt':
          sort.createdAt = sortOrder === 'asc' ? 1 : -1;
          break;
        case 'listaHyper':
          // Per ordinare per numero di hyper, usiamo la pipeline di aggregazione
          const pipeline: any[] = [
            { $match: filter },
            {
              $addFields: {
                hyperCount: { $size: { $ifNull: ["$listaHyper", []] } }
              }
            },
            { $sort: { hyperCount: sortOrder === 'asc' ? 1 : -1 } }
          ];
          
          if (skip && typeof skip === 'string') {
            pipeline.push({ $skip: parseInt(skip) });
          }
          
          if (limit && typeof limit === 'string') {
            pipeline.push({ $limit: parseInt(limit) });
          }

          const risultatiAggregazione = await Proposta.aggregate(pipeline);
          const proposteProcessate = risultatiAggregazione.map(p => {
            if (p.foto?.data && Buffer.isBuffer(p.foto.data)) {
              p.foto.data = p.foto.data.toString('base64');
            }
            return p;
          });

          return res.json({
            proposte: proposteProcessate,
            total: await Proposta.countDocuments(filter)
          });
        case 'titolo':
          sort.titolo = sortOrder === 'asc' ? 1 : -1;
          break;
        default:
          sort.createdAt = -1; // Default: più recenti prima
      }
    } else {
      sort.createdAt = -1; // Default: più recenti prima
    }

    // Query con paginazione
    let query = Proposta.find(filter).sort(sort);
    
    if (skip && typeof skip === 'string') {
      query = query.skip(parseInt(skip));
    }
    
    if (limit && typeof limit === 'string') {
      query = query.limit(parseInt(limit));
    }

    const proposte = await query.exec();
    const total = await Proposta.countDocuments(filter);

    const proposteProcessate = proposte.map(p => {
      const obj = p.toObject();
      if (obj.foto?.data && Buffer.isBuffer(obj.foto.data)) {
        obj.foto.data = obj.foto.data.toString('base64');
      }
      return obj;
    });

    res.json({
      proposte: proposteProcessate,
      total,
      hasMore: (parseInt(skip as string || '0') + proposteProcessate.length) < total
    });

  } catch (error) {
    console.error("Errore nella ricerca proposte:", error);
    res.status(500).json({ message: "Errore nella ricerca" });
  }
};

export const addProposta = async (req: Request, res: Response): Promise<void> => {
  try {
    // Gestione errori multer per file troppo grandi o tipo non supportato
    if (req.file && req.file.size > 2 * 1024 * 1024) {
      res.status(400).json({ message: "Il file non può superare i 2MB" });
      return;
    }

    // Ricostruisci l'indirizzo dall'input flat
    const luogo = {
      citta: req.body.indirizzo_citta,
      cap: req.body.indirizzo_cap,
      via: req.body.indirizzo_via,
      civico: req.body.indirizzo_civico,
    };
    
    // Inizializza lo stato con valori predefiniti se non fornito
    const stato = typeof req.body.stato === "string"
      ? JSON.parse(req.body.stato)
      : req.body.stato || { stato: "in_approvazione", commento: "Nessun commento" };

    // Assicurati che stato.commento sia definito
    if (!stato.commento) {
      stato.commento = "Nessun commento";
    }

    const newProposta = new Proposta({
      titolo: req.body.titolo,
      descrizione: req.body.descrizione,
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
      categoria: req.body.categoria,
      luogo,
      dataIpotetica: req.body.dataIpotetica,
      proponenteID: req.body.proponenteID,
      stato,
    });

    const propostaSalvata = await newProposta.save();
    const propostaObj = propostaSalvata.toObject();
    // non serve più convertire in base64 in risposta, è già stringa
    res.status(201).json({ message: "Proposta created successfully", proposta: propostaObj });
  } catch (error) {
    console.error("Errore durante la creazione della proposta:", error);
    res.status(500).json({ message: "Error creating proposta", error });
  }
};

export const getPendingProposte = async (_req: Request, res: Response) => {
  try {
    const proposte = await Proposta.find({ "stato.stato": "in_approvazione" })
      .sort({ createdAt: 1 });
    const proposteProcessate = proposte.map(p => {
      const obj = p.toObject();
      if (obj.foto?.data && Buffer.isBuffer(obj.foto.data)) {
        obj.foto.data = obj.foto.data.toString('base64');
      }
      return obj;
    });
    res.json(proposteProcessate);
  } catch (error) {
    console.error("Errore nel recupero proposte pending:", error);
    res.status(500).json({ message: "Errore interno" });
  }
};

export const updateStatoProposta = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { stato, commento } = req.body;
  try {
    const proposta = await Proposta.findById(id);
    if (!proposta) return res.status(404).json({ message: "Proposta non trovata" });

    proposta.stato = {
      stato,
      commento: commento ?? proposta.stato?.commento ?? "",
    } as any;

    await proposta.save();
    const propostaObj = proposta.toObject();
    if (propostaObj.foto?.data && Buffer.isBuffer(propostaObj.foto.data)) {
      propostaObj.foto.data = propostaObj.foto.data.toString('base64');
    }
    res.json(propostaObj);
  } catch (error) {
    console.error("Errore aggiornamento stato proposta:", error);
    res.status(500).json({ message: "Errore aggiornamento stato" });
  }
};

export const hyperProposta = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  try {
    const proposta = await Proposta.findById(id);
    if (!proposta) return res.status(404).json({ message: "Proposta non trovata" });
    
    // Inizializza listaHyper se non esiste
    if (!proposta.listaHyper) {
      proposta.listaHyper = [];
    } else if (!Array.isArray(proposta.listaHyper)) {
      proposta.listaHyper = [];
    }

    //controllo per permettere inserimento e rimozione hype
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const index = proposta.listaHyper.map(id => id.toString()).indexOf(userId);

    if (index === -1) {
      proposta.listaHyper.push(userId); // aggiungi hype
    } else {
      proposta.listaHyper.splice(index, 1); // togli hype
    }

    //controlla che il commento e lo stato siano presenti, anche se dovrebbero già esserlo
    if (!proposta.stato) {
      proposta.stato = { stato: "in_approvazione", commento: "Nessun commento" };
    }
    if (!proposta.stato.commento) {
      proposta.stato.commento = "Nessun commento";
    }

    await proposta.save();
    
    res.json(proposta);
  } catch (err) {
    console.error("Errore PATCH hyper:", err);
    res.status(500).json({ message: "Errore nell'aggiunta dell'hyper" });
  }
};

export const aggiungiCommento = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { contenuto } = req.body;
  const userId = req.user?.userId;
  try {
    const proposta = await Proposta.findById(id);
    if (!proposta) return res.status(404).json({ message: "Proposta non trovata" });

    // Validazione contenuto
    if (!contenuto || !contenuto.trim()) {
      return res.status(400).json({ message: "Il contenuto del commento è obbligatorio" });
    }
    
    if (contenuto.trim().length > 500) {
      return res.status(400).json({ message: "Il commento non può superare i 500 caratteri" });
    }

    // Crea il commento
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const nuovoCommento = new Commento({
      utente: userId,
      proposta: proposta._id,
      contenuto: contenuto.trim(),
      dataOra: new Date(),
      isRisposta: false,
    });
    await nuovoCommento.save();

    // Recupera tutti i commenti della proposta
    const commenti = await Commento.find({ proposta: proposta._id }).populate("utente", "nome");

    res.json({ commenti });
  } catch (err) {
    console.error("Errore aggiunta commento:", err);
    res.status(500).json({ message: "Errore nell'aggiunta del commento" });
  }
};

export const getCommentiProposta = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const proposta = await Proposta.findById(id);
    if (!proposta) return res.status(404).json({ message: "Proposta non trovata" });

    const commenti = await Commento.find({ proposta: proposta._id }).populate("utente", "nome");
    res.json({ commenti });
  } catch (err) {
    console.error("Errore nel recupero commenti:", err);
    res.status(500).json({ message: "Errore nel recupero dei commenti" });
  }
};

export const getPropostaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const proposta = await Proposta.findById(id);
    if (!proposta) return res.status(404).json({ message: "Proposta non trovata" });

    const propostaObj = proposta.toObject();
    // se per qualche motivo fosse ancora Buffer lo converto
    if (propostaObj.foto?.data && Buffer.isBuffer(propostaObj.foto.data)) {
      propostaObj.foto.data = propostaObj.foto.data.toString('base64');
    }
    res.json(propostaObj);
  } catch (error) {
    console.error("Errore nel recupero proposta:", error);
    res.status(500).json({ message: "Errore nel recupero della proposta" });
  }
};

export const createProposta = async (req: Request, res: Response) => {
  try {
    // Ricostruisci l'indirizzo dall'input
    const luogo = {
      citta: req.body.indirizzo_citta,
      cap: req.body.indirizzo_cap,
      via: req.body.indirizzo_via,
      civico: req.body.indirizzo_civico,
    };
    
    const stato = typeof req.body.stato === "string"
      ? JSON.parse(req.body.stato)
      : req.body.stato || { stato: "in_approvazione", commento: "Nessun commento" };

    const nuovaProposta = new Proposta({
      titolo: req.body.titolo,
      descrizione: req.body.descrizione,
      categoria: req.body.categoria,
      luogo,
      dataIpotetica: req.body.dataIpotetica,
      proponenteID: req.body.proponenteID,
      stato,
    });
    
    if (req.file) {
      nuovaProposta.foto = {
        data: req.file.buffer.toString('base64'),
        contentType: req.file.mimetype
      };
    }
    
    const propostaSalvata = await nuovaProposta.save();
    const propostaObj = propostaSalvata.toObject();
    res.status(201).json(propostaObj);
  } catch (error) {
    console.error("Errore durante la creazione della proposta:", error);
    res.status(500).json({ message: "Error creating proposta", error });
  }
};

export const deleteProposta = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  
  try {
    const proposta = await Proposta.findById(id);
    if (!proposta) {
      return res.status(404).json({ message: "Proposta non trovata" });
    }
    
    // Verifica che l'utente sia il proprietario della proposta o un operatore
    const userType = req.user?.userType; // Corretto: userType invece di role
    
    // Converti entrambi i valori a stringa per il confronto
    const proponenteIdStr = proposta.proponenteID?.toString();
    const userIdStr = userId?.toString();
    
    console.log("Debug delete - proponenteID:", proponenteIdStr, "userId:", userIdStr, "userType:", userType);
    
    if (proponenteIdStr !== userIdStr && userType !== "operatore") {
      return res.status(403).json({ 
        message: "Non hai i permessi per eliminare questa proposta",
        debug: { proponenteId: proponenteIdStr, userId: userIdStr, userType: userType }
      });
    }
    
    // Elimina tutti i commenti associati alla proposta
    await Commento.deleteMany({ proposta: proposta._id });
    
    // Elimina la proposta
    await Proposta.findByIdAndDelete(proposta._id);
    
    res.json({ message: "Proposta eliminata con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione della proposta:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};

// Elimina un commento specifico
export const deleteCommento = async (req: AuthenticatedRequest, res: Response) => {
  const { commentoId } = req.params;
  const userId = req.user?.userId;
  const userType = req.user?.userType;

  try {
    const commento = await Commento.findById(commentoId).populate("utente", "_id");
    if (!commento) {
      return res.status(404).json({ message: "Commento non trovato" });
    }

    // Controlla i permessi: solo l'autore del commento o gli operatori possono eliminarlo
    const autorId = commento.utente?._id?.toString();
    if (autorId !== userId && userType !== "operatore") {
      return res.status(403).json({ 
        message: "Non hai i permessi per eliminare questo commento" 
      });
    }

    await Commento.findByIdAndDelete(commentoId);
    res.json({ message: "Commento eliminato con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione del commento:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};
