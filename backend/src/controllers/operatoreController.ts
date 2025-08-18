import { Request, Response } from "express";
import Operatore from "../models/Operatore";
import Proposta from "../models/Proposta";
import User from "../models/User";
import Ente from "../models/Ente";
import Commento from "../models/Commento";
import bcrypt from "bcrypt";
import { emailExists } from "../utils/emailHelper";
import { validatePassword } from "../utils/passwordValidator";
import { apiResponse } from "../utils/responseFormatter";

/**
 * Crea un nuovo operatore nel sistema
 * @param req - Richiesta HTTP con dati operatore
 * @param res - Risposta HTTP
 */
export const createOperatore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, nome = 'Operatore', cognome = 'Admin', password, oauthCode } = req.body;

    if (await emailExists(email)) {
      res.status(409).json(apiResponse({ message: 'Email già registrata' }));
      return;
    }

    // Controlli di sicurezza solo se abilitati
    const securityEnabled = process.env.ENABLE_SECURITY_CONTROLS !== 'false';
    
    let hashedPassword: string | undefined = undefined;
    if (password) {
      if (securityEnabled) {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          res.status(400).json(apiResponse({ message: "Password non valida", error: passwordValidation.errors }));
          return;
        }
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newOperatore = new Operatore({
      nome,
      cognome,
      credenziali: {
        email,
        ...(hashedPassword && { password: hashedPassword }),
        ...(oauthCode && { oauthCode }),
      },
    });

    await newOperatore.save();
    res.status(201).json(apiResponse({ data: newOperatore, message: "Operatore creato con successo" }));
  } catch (error) {
    console.error("Errore durante la creazione dell'operatore:", error);
    res.status(500).json(apiResponse({ message: "Errore creazione operatore", error }));
  }
};


/**
 * Recupera tutti gli operatori registrati
 * @param _req - Richiesta HTTP (non utilizzata)
 * @param res - Risposta HTTP con lista operatori
 */
export const getAllOperatori = async (_req: Request, res: Response): Promise<void> => {
  try {
    const operatori = await Operatore.find();
    res.json(apiResponse({ data: operatori, message: "Lista operatori" }));
  } catch (error) {
    res.status(500).json(apiResponse({ message: 'Errore recupero operatori', error }));
  }
};

/**
 * Aggiorna i dati di un operatore esistente
 * @param req - Richiesta HTTP con ID operatore e dati da aggiornare
 * @param res - Risposta HTTP
 */
export const updateOperatore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nome, cognome, email, password } = req.body;
    const updateData: any = { nome, cognome, 'credenziali.email': email };
    
    if (password) {
      updateData['credenziali.password'] = await bcrypt.hash(password, 10);
    }
    
    const updated = await Operatore.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      res.status(404).json(apiResponse({ message: 'Operatore non trovato' }));
      return;
    }
    
    res.json(apiResponse({ data: updated, message: "Operatore aggiornato" }));
  } catch (error) {
    res.status(500).json(apiResponse({ message: 'Errore aggiornamento operatore', error }));
  }
};

/**
 * Elimina un operatore dal sistema
 * @param req - Richiesta HTTP con ID operatore
 * @param res - Risposta HTTP
 */
export const deleteOperatore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Operatore.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json(apiResponse({ message: 'Operatore non trovato' }));
      return;
    }
    
    res.json(apiResponse({ message: 'Operatore eliminato' }));
  } catch (error) {
    res.status(500).json(apiResponse({ message: 'Errore eliminazione operatore', error }));
  }
};

/**
 * Recupera statistiche per il pannello operatore
 * @param _req - Richiesta HTTP (non utilizzata)
 * @param res - Risposta HTTP con statistiche
 */
export const getOperatorStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Conta utenti e enti separatamente
    const utentiCount = await User.countDocuments();
    const entiCount = await Ente.countDocuments();
    const utentiTotali = utentiCount + entiCount;
    
    // Conta proposte per stato
    const proposteInAttesa = await Proposta.countDocuments({ "stato.stato": 'in_approvazione' });
    const proposteApprovate = await Proposta.countDocuments({ "stato.stato": 'approvata' });
    const proposteRifiutate = await Proposta.countDocuments({ "stato.stato": 'rifiutata' });
    
    // Conta commenti totali
    const commentiTotali = await Commento.countDocuments();
    
    const stats = {
      proposteInAttesa,
      proposteApprovate,
      proposteRifiutate,
      utentiRegistrati: utentiCount,
      entiRegistrati: entiCount,
      commentiTotali,
      utentiTotali
    };
    
    res.json(apiResponse({ data: stats, message: "Statistiche operatore" }));
  } catch (error) {
    console.error("Errore nel recupero statistiche operatore:", error);
    res.status(500).json(apiResponse({ message: "Errore interno del server", error }));
  }
};

