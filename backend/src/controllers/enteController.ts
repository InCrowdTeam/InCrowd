import { Request, Response } from "express";
import Ente from "../models/Ente";
import bcrypt from "bcrypt";

export const createEnte = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, codiceFiscale, biografia, email, password } = req.body;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const newEnte = new Ente({
      nome,
      codiceFiscale,
      biografia,
      fotoProfilo: {
        data: req.file?.buffer,
        contentType: req.file?.mimetype,
      },
      credenziali: {
        email,
        ...(hashedPassword && { password: hashedPassword }),
      },
    });

    await newEnte.save();
    res.status(201).json({ message: "Ente created successfully", ente: newEnte });
  } catch (error) {
    console.error("Errore durante la creazione dell'ente:", error);
    res.status(500).json({ message: "Error creating ente", error });
  }

