import { Request, Response } from "express";
import Operatore from "../models/Operatore";
import Proposta from "../models/Proposta";
import User from "../models/User";
import Ente from "../models/Ente";
import bcrypt from "bcrypt";
import { emailExists } from "../utils/emailHelper";
import { validatePassword } from "../utils/passwordValidator";

export const createOperatore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, nome = 'Operatore', cognome = 'Admin', password, oauthCode } = req.body;

    if (await emailExists(email)) {
      res.status(409).json({ message: 'Email già registrata' });
      return;
    }

    // Controlli di sicurezza solo se abilitati
    const securityEnabled = process.env.ENABLE_SECURITY_CONTROLS !== 'false';
    
    let hashedPassword: string | undefined = undefined;
    if (password) {
      if (securityEnabled) {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          res.status(400).json({ 
            message: "Password non valida", 
            errors: passwordValidation.errors 
          });
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
    res.status(201).json({ message: "Operatore created successfully", operatore: newOperatore });
  } catch (error) {
    console.error("Errore durante la creazione dell'operatore:", error);
    res.status(500).json({ message: "Error creating operatore", error });
  }
}

export const getAllOperatori = async (_req: Request, res: Response): Promise<void> => {
  try {
    const operatori = await Operatore.find()
    res.json(operatori)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching operatori', error })
  }
}

export const updateOperatore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { nome, cognome, email, password } = req.body
    const updateData: any = { nome, cognome, 'credenziali.email': email }
    if (password) {
      updateData['credenziali.password'] = await bcrypt.hash(password, 10)
    }
    const updated = await Operatore.findByIdAndUpdate(id, updateData, { new: true })
    if (!updated) {
      res.status(404).json({ message: 'Operatore not found' })
      return
    }
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Error updating operatore', error })
  }
}

export const deleteOperatore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const deleted = await Operatore.findByIdAndDelete(id)
    if (!deleted) {
      res.status(404).json({ message: 'Operatore not found' })
      return
    }
    res.json({ message: 'Operatore deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting operatore', error })
  }
}

export const getOperatorStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Conta utenti e enti separatamente
    const utentiCount = await User.countDocuments();
    const entiCount = await Ente.countDocuments();
    const utentiTotali = utentiCount + entiCount;
    
    // Conta proposte per stato
    const proposteInAttesa = await Proposta.countDocuments({ "stato.stato": "in_approvazione" });
    const proposteApprovate = await Proposta.countDocuments({ "stato.stato": "approvata" });
    const proposteRifiutate = await Proposta.countDocuments({ "stato.stato": "rifiutata" });
    
    const stats = {
      utentiTotali,
      utentiCount,
      entiCount,
      proposteInAttesa,
      proposteApprovate,
      proposteRifiutate
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Errore nel recupero statistiche operatore:", error);
    res.status(500).json({ message: "Errore interno nel recupero statistiche" });
  }
}

