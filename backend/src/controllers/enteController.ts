import { Request, Response } from "express";
import Ente from "../models/Ente";
import bcrypt from "bcrypt";
import { isValidCodiceFiscale } from "../utils/codiceFiscale";
import { emailExists } from "../utils/emailHelper";

export const createEnte = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, codiceFiscale, biografia, email, password, oauthCode } = req.body;

    if (!isValidCodiceFiscale(codiceFiscale)) {
      res.status(400).json({ message: "Codice fiscale non valido" });
      return;
    }

    if (await emailExists(email)) {
      res.status(409).json({ message: "Email già registrata" });
      return;
    }

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
        ...(oauthCode && { oauthCode }),
      },
    });

    await newEnte.save();
    res.status(201).json({ message: "Ente created successfully", ente: newEnte });
  } catch (error) {
    console.error("Errore durante la creazione dell'ente:", error);
    res.status(500).json({ message: "Error creating ente", error });
  }
}

