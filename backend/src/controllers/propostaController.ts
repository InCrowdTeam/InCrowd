import { Request, Response } from "express";
import Proposta from "../models/Proposta";
import Commento from "../models/Commento";

export const getAllProposte = async (req: Request, res: Response) => {
  try {
    const proposte = await Proposta.find();
    const proposteProcessate = proposte.map(p => {
      const obj = p.toObject();
      // se è ancora Buffer lo converto, altrimenti lascio la stringa
      if (obj.foto?.data && Buffer.isBuffer(obj.foto.data)) {
        obj.foto.data = obj.foto.data.toString('base64');
      }
      return obj;
    });
    res.json(proposteProcessate);
  } catch (error) {
    console.error("Errore nel recupero proposte:", error);
    res.status(500).json({ message: "Errore interno" });
  }
};

export const addProposta = async (req: Request, res: Response): Promise<void> => {
  try {
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
        ? {
            // salvo direttamente la stringa base64
            data: req.file.buffer.toString('base64'),
            contentType: req.file.mimetype,
          }
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
  const { titolo } = req.params;
  const titoloDecoded = decodeURIComponent(titolo);
  const { stato, commento } = req.body;
  try {
    const proposta = await Proposta.findOne({ titolo: titoloDecoded });
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

export const hyperProposta = async (req: Request, res: Response) => {
  const { titolo } = req.params;
  const titoloDecoded = decodeURIComponent(titolo);
  const { userId } = req.body;
  try {
    const proposta = await Proposta.findOne({ titolo: titoloDecoded });
    if (!proposta) return res.status(404).json({ message: "Proposta non trovata" });
    
    // Inizializza listaHyper se non esiste
    if (!proposta.listaHyper) {
      proposta.listaHyper = [];
    } else if (!Array.isArray(proposta.listaHyper)) {
      proposta.listaHyper = [];
    }

    //controllo per permettere inserimento e rimozione hype
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

export const aggiungiCommento = async (req: Request, res: Response) => {
  const { titolo } = req.params;
  const titoloDecoded = decodeURIComponent(titolo);
  const { contenuto, userId } = req.body;
  try {
    const proposta = await Proposta.findOne({ titolo: titoloDecoded });
    if (!proposta) return res.status(404).json({ message: "Proposta non trovata" });

    // Crea il commento
    const nuovoCommento = new Commento({
      utente: userId,
      proposta: proposta._id,
      contenuto,
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
  const { titolo } = req.params;
  const titoloDecoded = decodeURIComponent(titolo);
  try {
    const proposta = await Proposta.findOne({ titolo: titoloDecoded });
    if (!proposta) return res.status(404).json({ message: "Proposta non trovata" });

    const commenti = await Commento.find({ proposta: proposta._id }).populate("utente", "nome");
    res.json({ commenti });
  } catch (err) {
    console.error("Errore nel recupero commenti:", err);
    res.status(500).json({ message: "Errore nel recupero dei commenti" });
  }
};

export const getPropostaByTitolo = async (req: Request, res: Response) => {
  try {
    const titoloDecoded = decodeURIComponent(req.params.titolo);
    const proposta = await Proposta.findOne({ titolo: titoloDecoded });
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
