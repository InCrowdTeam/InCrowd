import { Request, Response } from "express";
import Operatore from "../models/Operatore";
import bcrypt from "bcrypt";

export const createOperatore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, cognome, email, password } = req.body;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const newOperatore = new Operatore({
      nome,
      cognome,
      credenziali: {
        email,
        ...(hashedPassword && { password: hashedPassword }),
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

