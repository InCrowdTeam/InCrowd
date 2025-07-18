import { Request, Response } from "express";
import Ente from "../models/Ente";
import bcrypt from "bcrypt";
import { isValidCodiceFiscale } from "../utils/codiceFiscale";
import { emailExists } from "../utils/emailHelper";

export const createEnte = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, codiceFiscale, biografia, email, password, oauthCode, fotoProfiloGoogle } = req.body;

    if (!isValidCodiceFiscale(codiceFiscale)) {
      res.status(400).json({ message: "Codice fiscale non valido" });
      return;
    }

    if (await emailExists(email)) {
      res.status(409).json({ message: "Email già registrata" });
      return;
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    // Gestione foto profilo
    let fotoProfilo: { data?: string | Buffer, contentType?: string } = {};
    
    if (req.file) {
      // Foto caricata dall'utente
      fotoProfilo = {
        data: req.file.buffer.toString('base64'),
        contentType: req.file.mimetype,
      };
    } else if (fotoProfiloGoogle) {
      // Foto da Google
      try {
        const googlePhoto = JSON.parse(fotoProfiloGoogle);
        fotoProfilo = {
          data: googlePhoto.data,
          contentType: googlePhoto.contentType,
        };
      } catch (e) {
        console.error('Errore parsing foto Google:', e);
      }
    }

    const newEnte = new Ente({
      nome,
      codiceFiscale,
      biografia,
      ...(Object.keys(fotoProfilo).length > 0 && { fotoProfilo }),
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

