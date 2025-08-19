import 'dotenv/config'
import { Request, Response } from "express";
import Privato from "../models/Privato"; // Rinominato da User
import Ente from "../models/Ente";
import Operatore from "../models/Operatore";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { findAccountByEmail, createSafeCredentials } from "../utils/emailHelper";
import fetch from 'node-fetch';
import { apiResponse } from "../utils/responseFormatter";
import { validatePassword } from "../utils/passwordValidator";

// Configurazione JWT e Google OAuth

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminpass";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Scarica un'immagine da URL e la converte in base64
 * @param imageUrl - URL dell'immagine da scaricare
 * @returns Oggetto con dati base64 e content-type, o null se fallisce
 */
const downloadImageAsBase64 = async (imageUrl: string): Promise<{ data: string, contentType: string } | null> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return {
      data: base64,
      contentType
    };
  } catch (error) {
    console.error('Errore download immagine:', error);
    return null;
  }
};

/**
 * Gestisce il login tradizionale (email/password) o OAuth
 * @param req - Richiesta HTTP con credenziali
 * @param res - Risposta HTTP
 */
export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password, oauthCode } = req.body;

  try {
    // Login admin speciale
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { email, userType: "admin" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      const data = { token, userType: "admin" };
      return res.json({ ...apiResponse({ data, message: "Login effettuato" }), ...data });
    }

    // Cerca account per email (privato, ente, operatore)
    const { user, ente, operatore, count } = await findAccountByEmail(email);
    if (count > 1) {
      return res.status(409).json(apiResponse({ message: "Email duplicata" }));
    }

    const account: any = user || ente || operatore;
    let userType = "privato"; // Cambiato da "user" a "privato"
    if (ente) userType = "ente";
    if (operatore) userType = "operatore";

    if (!account) {
      return res.status(401).json(apiResponse({ message: "Credenziali non valide" }));
    }

    // Validazione credenziali
    if (account.credenziali.password) {
      if (!password) {
        return res.status(401).json(apiResponse({ message: "Credenziali non valide" }));
      }
      const passwordMatch = await bcrypt.compare(
        password,
        account.credenziali.password
      );
      if (!passwordMatch) {
        return res.status(401).json({ message: "Credenziali non valide" });
      }
    } else if (account.credenziali.oauthCode) {
      if (!oauthCode && password) {
        // L'utente sta cercando di fare login con password ma ha solo OAuth
        return res.status(401).json(apiResponse({ 
          message: "Password non impostata. Accedere con Google e impostare una password dalle impostazioni del profilo." 
        }));
      }
      if (!oauthCode || oauthCode !== account.credenziali.oauthCode) {
        return res.status(401).json(apiResponse({ message: "Credenziali non valide" }));
      }
    } else {
      return res.status(401).json(apiResponse({ message: "Credenziali non valide" }));
    }

    // Genera token JWT
    const token = jwt.sign(
      { userId: account._id, email: account.credenziali.email, userType },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const data = { 
      token, 
      user: {
        ...createSafeCredentials(account),
        user_type: userType // Add user_type to the user object
      }, 
      userType 
    };
    return res.json({ ...apiResponse({ data, message: "Login effettuato" }), ...data });
  } catch (err) {
    return res.status(500).json(apiResponse({ message: "Errore del server", error: err }));
  }
};

/**
 * Gestisce il login tramite Google OAuth
 * @param req - Richiesta HTTP con token Google
 * @param res - Risposta HTTP
 */
export const googleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json(apiResponse({ message: "Token mancante" }));

  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json(apiResponse({ message: 'Configurazione Google OAuth mancante' }));
    }
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      return res.status(400).json(apiResponse({ message: "Token non valido" }));
    }

    // Cerca account esistente o creane uno nuovo
    const { user, ente, operatore, count } = await findAccountByEmail(payload.email);
    if (count > 1) {
      return res.status(409).json(apiResponse({ message: "Email duplicata" }));
    }

    let account: any = user || ente || operatore;
    let userType = "privato"; // Cambiato da "user" a "privato"
    if (ente) userType = "ente";
    if (operatore) userType = "operatore";

    if (!account) {
      // NON creare account automaticamente, mandare a completeGoogleSignup
      return res.status(404).json({ 
        needsRegistration: true,
        data: { 
          email: payload.email,
          oauthCode: payload.sub,
          nome: payload.given_name || "Nome",
          cognome: payload.family_name || undefined,
          fotoProfilo: payload.picture ? await downloadImageAsBase64(payload.picture) : undefined
        }
      });
    } else {
      // Aggiorna OAuth code se diverso
      if (account.credenziali.oauthCode !== payload.sub) {
        account.credenziali.oauthCode = payload.sub;
        await account.save();
      }
    }



    // Aggiorna foto profilo se non presente e disponibile su Google
    if (!account.fotoProfilo && payload.picture) {
      const fotoProfilo = await downloadImageAsBase64(payload.picture);
      if (fotoProfilo) {
        account.fotoProfilo = fotoProfilo;
        await account.save();
      }
    }

    const token = jwt.sign(
      { userId: account._id, email: account.credenziali.email, userType },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const data = { 
      token, 
      user: {
        ...createSafeCredentials(account),
        user_type: userType // Add user_type to the user object
      }, 
      userType 
    };
    res.json({ ...apiResponse({ data, message: "Login Google effettuato" }), ...data });
  } catch (err: any) {
    const message = err?.message || err.toString();
    res.status(500).json(apiResponse({ message: `Errore login Google: ${message}` }));
  }
};

/**
 * Collega un account Google a un utente esistente
 * @param req - Richiesta HTTP autenticata con token Google
 * @param res - Risposta HTTP
 */
export const linkGoogleAccount = async (req: Request, res: Response) => {
  const { idToken } = req.body;
  const userId = (req as any).user?.userId;
  const userType = (req as any).user?.userType;

  if (!idToken) return res.status(400).json(apiResponse({ message: "Token mancante" }));
  if (!userId) return res.status(401).json(apiResponse({ message: "Utente non autenticato" }));

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    if (!payload?.email || !payload.sub) {
      return res.status(400).json(apiResponse({ message: "Token non valido" }));
    }

    // Determina quale modello utilizzare in base al tipo di utente autenticato
    let user: any;
    let Model: any;
    
    if (userType === 'privato') { 
      user = await Privato.findById(userId);
      Model = Privato;
    } else if (userType === 'ente') {
      user = await Ente.findById(userId);
      Model = Ente;
    } else {
      return res.status(400).json(apiResponse({ message: "Tipo utente non supportato per il collegamento Google" }));
    }
    
    if (!user) {
      return res.status(404).json(apiResponse({ message: "Utente non trovato" }));
    }

    if (user.credenziali?.email !== payload.email) {
      return res.status(400).json(apiResponse({ 
        message: "L'email dell'account Google deve corrispondere a quella del profilo" 
      }));
    }

    // Verifica che l'account Google non sia già collegato a un altro utente
    // Controlla in entrambi i modelli (Privato ed Ente) per evitare duplicati
    
    const existingPrivato = await Privato.findOne({
      "credenziali.oauthCode": payload.sub,
      _id: { $ne: userId }
    });
    
    const existingEnte = await Ente.findOne({
      "credenziali.oauthCode": payload.sub,
      _id: { $ne: userId }
    });

    if (existingPrivato || existingEnte) {
      return res.status(409).json(apiResponse({ 
        message: "Questo account Google è già collegato a un altro profilo" 
      }));
    }

    // Collega l'account Google
    const currentEmail = user.credenziali?.email || payload.email;
    if (!user.credenziali) {
      user.credenziali = { email: currentEmail, oauthCode: payload.sub };
    } else {
      user.credenziali.oauthCode = payload.sub;
    }

    // Aggiorna foto profilo se non presente e disponibile su Google
    if (!user.fotoProfilo && payload.picture) {
      const fotoProfilo = await downloadImageAsBase64(payload.picture);
      if (fotoProfilo) {
        user.fotoProfilo = fotoProfilo;
      }
    }

    await user.save();

    // Restituisce i dati aggiornati dell'utente con credenziali sicure
    const updatedUser = await Model.findById(userId);
    const safeUser = createSafeCredentials(updatedUser!);

    res.json({ 
      ...apiResponse({ message: "Account Google collegato con successo", data: { user: safeUser } }),
      user: safeUser
    });
  } catch (err: any) {
    const message = err?.message || err.toString();
    res.status(500).json(apiResponse({ message: `Errore collegamento Google: ${message}` }));
  }
};

/**
 * Imposta la password per utenti (privati ed enti) che non ne hanno una (es. signup Google)
 * Permette di settare la password solo se non esiste già.
 */
export const updatePassword = async (req: any, res: Response) => {
  try {
    const { newPassword } = req.body;
    const { userId, userType } = req.user;

    if (!newPassword) {
      return res.status(400).json(
        apiResponse({ message: "La nuova password è obbligatoria" })
      );
    }

    // Validazione nuova password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json(
        apiResponse({ 
          message: "Password non valida", 
          error: { details: validation.errors }
        })
      );
    }

    // Trova utente in base al tipo
    let user: any;
    if (userType === 'ente') {
      user = await Ente.findById(userId);
    } else {
      user = await Privato.findById(userId);
    }

    if (!user) {
      return res.status(404).json(
        apiResponse({ message: "Utente non trovato" })
      );
    }

    // Permetti di settare la password solo se non esiste già
    if (user.credenziali && user.credenziali.password) {
      return res.status(400).json(
        apiResponse({ message: "La password è già stata impostata. Usa la funzione di cambio password." })
      );
    }

    // Hash e salva nuova password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    if (!user.credenziali) {
      user.credenziali = { email: user.credenziali?.email || user.email, password: hashedPassword };
    } else {
      user.credenziali.password = hashedPassword;
    }
    await user.save();

    // Restituisci l'utente aggiornato in modo sicuro
    const updatedUser = await (userType === 'ente' ? Ente.findById(userId) : Privato.findById(userId));
    const safeUser = createSafeCredentials(updatedUser!);

    res.json(apiResponse({ data: safeUser, message: "Password impostata con successo" }));

  } catch (err: any) {
    const message = err?.message || err.toString();
    res.status(500).json(
      apiResponse({ message: `Errore impostazione password: ${message}` })
    );
  }
};
