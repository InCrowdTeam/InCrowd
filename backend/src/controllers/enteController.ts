import { Request, Response } from "express";
import Ente from "../models/Ente";
import bcrypt from "bcrypt";
import { isValidCodiceFiscale } from "../utils/codiceFiscale";
import { emailExists } from "../utils/emailHelper";
import { validatePassword, sanitizeInput, validateEmail } from "../utils/passwordValidator";
import { apiResponse } from "../utils/responseFormatter";

export const getAllEnti = async (req: Request, res: Response) => {
  try {
    const enti = await Ente.find().select("-credenziali.password");
    
    // Processa le foto profilo convertendo Buffer in base64 se necessario
    const entiProcessati = enti.map(ente => {
      const obj = ente.toObject();
      if (obj.fotoProfilo?.data && Buffer.isBuffer(obj.fotoProfilo.data)) {
        obj.fotoProfilo.data = obj.fotoProfilo.data.toString('base64');
      }
      return obj;
    });
    
    res.json(apiResponse({ data: entiProcessati, message: "Lista enti" }));
  } catch (error) {
    console.error("Errore nel recupero enti:", error);
    res.status(500).json(apiResponse({ message: "Errore interno", error }));
  }
};

export const createEnte = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, codiceFiscale, biografia, email, password, oauthCode, fotoProfiloGoogle } = req.body;

    // Validazioni input obbligatori
    if (!nome || !nome.trim()) {
      res.status(400).json(apiResponse({ message: "Il nome dell'ente è obbligatorio" }));
      return;
    }

    if (!codiceFiscale || !codiceFiscale.trim()) {
      res.status(400).json(apiResponse({ message: "Il codice fiscale è obbligatorio" }));
      return;
    }

    if (!email || !email.trim()) {
      res.status(400).json(apiResponse({ message: "L'email è obbligatoria" }));
      return;
    }

    // Sanitizza gli input
    const sanitizedNome = sanitizeInput(nome);
    const sanitizedBiografia = biografia ? sanitizeInput(biografia) : "";
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedCodiceFiscale = codiceFiscale.trim().toUpperCase();

    // Controlli di sicurezza solo se abilitati
    const securityEnabled = process.env.ENABLE_SECURITY_CONTROLS !== 'false';
    
    if (securityEnabled) {
      // Validazioni specifiche
      if (!validateEmail(sanitizedEmail)) {
        res.status(400).json(apiResponse({ message: "Formato email non valido" }));
        return;
      }
    }

    // Per gli enti non validiamo il formato del codice fiscale (può essere P.IVA)

    if (await emailExists(sanitizedEmail)) {
      res.status(409).json(apiResponse({ message: "Email già registrata" }));
      return;
    }

    // Validazione password (solo se fornita e non OAuth)
    let hashedPassword: string | undefined = undefined;
    
    if (password && !oauthCode) {
      if (securityEnabled) {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          res.status(400).json(apiResponse({ 
            message: "Password non valida", 
            error: passwordValidation.errors 
          }));
          return;
        }
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Gestione foto profilo
    let fotoProfilo: { data?: string | Buffer, contentType?: string } | undefined = undefined;
    
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

    const enteData: any = {
      nome: sanitizedNome,
      codiceFiscale: sanitizedCodiceFiscale,
      biografia: sanitizedBiografia,
      credenziali: {
        email: sanitizedEmail,
        ...(hashedPassword && { password: hashedPassword }),
        ...(oauthCode && { oauthCode }),
      },
    };

    // Aggiungi fotoProfilo solo se è presente
    if (fotoProfilo && (fotoProfilo.data || fotoProfilo.contentType)) {
      enteData.fotoProfilo = fotoProfilo;
    }

    const newEnte = new Ente(enteData);

    await newEnte.save();
    res.status(201).json(apiResponse({ data: newEnte, message: "Ente creato con successo" }));
  } catch (error) {
    console.error("Errore durante la creazione dell'ente:", error);
    res.status(500).json(apiResponse({ message: "Errore nella creazione dell'ente", error }));
  }
}

