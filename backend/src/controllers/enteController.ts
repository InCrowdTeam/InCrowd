import { Request, Response } from "express";
import Ente from "../models/Ente";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { isValidCodiceFiscale } from "../utils/codiceFiscale";
import { emailExists, createSafeCredentials } from "../utils/emailHelper";
import { validatePassword, sanitizeInput, validateEmail } from "../utils/passwordValidator";
import { apiResponse } from "../utils/responseFormatter";

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Recupera tutti gli enti registrati (solo per operatori)
 * @param req - Richiesta HTTP autenticata
 * @param res - Risposta HTTP con lista enti
 */
export const getAllEnti = async (req: Request, res: Response) => {
  try {
    const enti = await Ente.find();
    
    // Processa le foto profilo e crea versioni sicure
    const entiProcessati = enti.map(ente => {
      const safeEnte = createSafeCredentials(ente);
      
      // Processa la foto profilo convertendo Buffer in base64 se necessario
      if (safeEnte.fotoProfilo?.data && Buffer.isBuffer(safeEnte.fotoProfilo.data)) {
        safeEnte.fotoProfilo.data = safeEnte.fotoProfilo.data.toString('base64');
      }
      
      return safeEnte;
    });
    
    res.json(apiResponse({ data: entiProcessati, message: "Lista enti" }));
  } catch (error) {
    console.error("Errore nel recupero enti:", error);
    res.status(500).json(apiResponse({ message: "Errore interno", error }));
  }
};

/**
 * Crea un nuovo ente nel sistema
 * @param req - Richiesta HTTP con dati ente
 * @param res - Risposta HTTP
 */
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

    // Sanitizza gli input per prevenire injection
    const sanitizedNome = sanitizeInput(nome);
    const sanitizedBiografia = biografia ? sanitizeInput(biografia) : "";
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedCodiceFiscale = codiceFiscale.trim().toUpperCase();

    // Controlli di sicurezza solo se abilitati
    const securityEnabled = process.env.ENABLE_SECURITY_CONTROLS !== 'false';
    
    if (securityEnabled) {
      // Validazioni specifiche per sicurezza
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

    // Validazione e hashing password (solo se fornita e non OAuth)
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
    
    // Restituisce i dati sicuri dell'ente con hasPassword
    const safeEnte = createSafeCredentials(newEnte);
    
    // Genera token JWT per consentire login automatico dopo registrazione
    const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
    const token = jwt.sign(
      { userId: newEnte._id, email: newEnte.credenziali.email, userType: "ente" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // Restituisce dati ente, token e tipo per login automatico
    const responseData = {
      user: safeEnte,
      token,
      userType: "ente"
    };
    
    res.status(201).json(apiResponse({ data: responseData, message: "Ente creato con successo" }));
  } catch (error) {
    console.error("Errore durante la creazione dell'ente:", error);
    res.status(500).json(apiResponse({ message: "Errore nella creazione dell'ente", error }));
  }
};

/**
 * Aggiorna il profilo dell'ente corrente
 * @param req - Richiesta HTTP autenticata con dati profilo
 * @param res - Risposta HTTP
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json(apiResponse({ message: "Ente non autenticato" }));
    }

    const { nome, biografia } = req.body;

    // Validazioni
    if (!nome || !nome.trim()) {
      return res.status(400).json(apiResponse({ message: "Il nome dell'ente è obbligatorio" }));
    }

    if (biografia && biografia.length > 500) {
      return res.status(400).json(apiResponse({ message: "La biografia non può superare i 500 caratteri" }));
    }

    // Trova l'ente corrente
    const ente = await Ente.findById(userId);
    if (!ente) {
      return res.status(404).json(apiResponse({ message: "Ente non trovato" }));
    }

    // Aggiorna i dati (email non modificabile)
    ente.nome = nome.trim();
    ente.biografia = biografia?.trim() || "";

    // Gestione foto profilo
    if (req.file) {
      // Validazione semplice foto profilo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json(apiResponse({ message: "Tipo di file non supportato. Usa JPEG, PNG o GIF." }));
      }
      
      // Controllo dimensione massima 5MB
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (req.file.size > maxSize) {
        return res.status(400).json(apiResponse({ message: "File troppo grande. Dimensione massima: 5MB" }));
      }
      
      // Usa l'immagine originale senza compressione
      ente.fotoProfilo = {
        data: req.file.buffer.toString('base64'),
        contentType: req.file.mimetype,
      };
    }

    await ente.save();

    // Restituisce i dati aggiornati dell'ente con hasPassword
    const updatedEnte = await Ente.findById(userId);
    const safeEnte = createSafeCredentials(updatedEnte!);
    
    res.json(apiResponse({ data: safeEnte, message: "Profilo aggiornato con successo" }));
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo ente:", error);
    res.status(500).json(apiResponse({ message: "Errore interno del server", error }));
  }
};

/**
 * Aggiorna la password dell'ente corrente
 * @param req - Richiesta HTTP autenticata con nuova password
 * @param res - Risposta HTTP
 */
export const updatePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json(apiResponse({ message: "Ente non autenticato" }));
    }

    const { newPassword } = req.body;

    // Validazioni con i nuovi standard
    if (!newPassword) {
      return res.status(400).json(apiResponse({ message: "La nuova password è obbligatoria" }));
    }

    const securityEnabled = process.env.ENABLE_SECURITY_CONTROLS !== 'false';
    
    if (securityEnabled) {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json(apiResponse({ message: "Password non valida", error: passwordValidation.errors }));
      }
    }

    // Trova l'ente
    const ente = await Ente.findById(userId);
    if (!ente) {
      return res.status(404).json(apiResponse({ message: "Ente non trovato" }));
    }

    // Cripta la nuova password con 10 rounds
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Aggiorna la password
    if (!ente.credenziali) {
      // Se non esistono credenziali, crea un nuovo oggetto
      // L'email dovrebbe essere già presente nell'ente da quando è stato creato
      ente.credenziali = { email: "", password: hashedPassword };
    } else {
      // Mantieni l'email esistente e aggiorna solo la password
      ente.credenziali.password = hashedPassword;
    }

    await ente.save();

    // Restituisce i dati aggiornati dell'ente con hasPassword
    const updatedEnte = await Ente.findById(userId);
    const safeEnte = createSafeCredentials(updatedEnte!);

    res.json(apiResponse({ data: safeEnte, message: "Password aggiornata con successo" }));
  } catch (error) {
    console.error("Errore nell'aggiornamento della password ente:", error);
    res.status(500).json(apiResponse({ message: "Errore interno del server", error }));
  }
};

