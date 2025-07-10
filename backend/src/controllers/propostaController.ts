import { Request, Response } from "express";
import Proposta from "../models/Proposta";
import Commento from "../models/Commento";

export const getAllProposte = async (req: Request, res: Response) => {
  try {
    const proposte = await Proposta.find();
    const proposteConFoto = proposte.map(p => ({
      ...p.toObject(),
      foto: p.foto && p.foto.data
        ? {
            data: p.foto.data,
            contentType: p.foto.contentType
          }
        : null
    }));
    res.json(proposteConFoto);
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
    const stato = typeof req.body.stato === "string"
    ? JSON.parse(req.body.stato)
    : req.body.stato;

    if (!stato.commento) {
      stato.commento = "Nessun commento";
    }

    const newProposta = new Proposta({
      titolo: req.body.titolo,
      descrizione: req.body.descrizione,
      foto: req.file
      ? {
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

    console.log("req.body:", req.body);
    if (!newProposta.stato) {
      newProposta.stato = { stato: "in_approvazione", commento: "Nessun commento" };
    }

    await newProposta.save();
    res.status(201).json({ message: "Proposta created successfully", proposta: newProposta });
  } catch (error) {
    console.error("Errore durante la creazione della proposta:", error);
    res.status(500).json({ message: "Error creating proposta", error });
  }
};

export const hyperProposta = async (req: Request, res: Response) => {
  const { titolo } = req.params;
  const titoloDecoded = decodeURIComponent(titolo);
  const { userId } = req.body;
  try {
    const proposta = await Proposta.findOne({ titolo: titoloDecoded });
    if (!proposta) return res.status(404).json({ message: "Proposta non trovata" });
    if (!Array.isArray(proposta.listaHyper)) {
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