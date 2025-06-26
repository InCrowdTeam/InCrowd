import { Request, Response } from "express";
import Proposta from "../models/Proposta";

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
    console.log("Entro in Controller:", req.body);
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
      newProposta.stato = { stato: "in_approvazione", commento: "" };
    }

    await newProposta.save();
    res.status(201).json({ message: "Proposta created successfully", proposta: newProposta });
  } catch (error) {
    console.error("Errore durante la creazione della proposta:", error);
    res.status(500).json({ message: "Error creating proposta", error });
  }
};