import 'dotenv/config'
import { Request, Response } from "express";
import User from "../models/User";
import Ente from "../models/Ente";
import Operatore from "../models/Operatore";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { findAccountByEmail, createSafeCredentials } from "../utils/emailHelper";
import fetch from 'node-fetch';
import { apiResponse } from "../utils/responseFormatter";

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

    // Cerca account per email (user, ente, operatore)
    const { user, ente, operatore, count } = await findAccountByEmail(email);
    if (count > 1) {
      return res.status(409).json(apiResponse({ message: "Email duplicata" }));
    }

    const account: any = user || ente || operatore;
    let userType = "user";
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

    const data = { token, user: createSafeCredentials(account), userType };
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
      console.error("GOOGLE_CLIENT_ID not set in environment");
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
    let userType = "user";
    if (ente) userType = "ente";
    if (operatore) userType = "operatore";

    if (!account) {
      // Crea nuovo account per email Google
      const User = (await import("../models/User")).default;
      const Ente = (await import("../models/Ente")).default;
      const Operatore = (await import("../models/Operatore")).default;

      // Determina tipo: se c'è cognome, è user, altrimenti ente
      let type = 'user';
      if (payload.family_name) {
        type = 'user';
      } else {
        // Se non c'è cognome, o se l'utente ha scelto ente, tutto in nome
        type = 'ente';
      }

      if (type === 'user') {
        account = new User({
          nome: payload.given_name || "Nome",
          cognome: payload.family_name || "Cognome",
          codiceFiscale: "TEMP_" + Date.now(), // Temporaneo, da aggiornare
          biografia: "",
          credenziali: {
            email: payload.email,
            oauthCode: payload.sub,
          },
          fotoProfilo: payload.picture ? await downloadImageAsBase64(payload.picture) : undefined,
        });
      } else {
        account = new Ente({
          nome: payload.name || "Nome Ente",
          codiceFiscale: "TEMP_" + Date.now(), // Temporaneo, da aggiornare
          biografia: "",
          credenziali: {
            email: payload.email,
            oauthCode: payload.sub,
          },
          fotoProfilo: payload.picture ? await downloadImageAsBase64(payload.picture) : undefined,
        });
      }

      await account.save();
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

    const data = { token, user: createSafeCredentials(account), userType };
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

    // Verifica che l'email del token Google corrisponda a quella dell'utente
    const User = (await import("../models/User")).default;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(apiResponse({ message: "Utente non trovato" }));
    }

    if (user.credenziali?.email !== payload.email) {
      return res.status(400).json(apiResponse({ 
        message: "L'email dell'account Google deve corrispondere a quella del profilo" 
      }));
    }

    // Verifica che l'account Google non sia già collegato a un altro utente
    const existingUser = await User.findOne({
      "credenziali.oauthCode": payload.sub,
      _id: { $ne: userId }
    });

    if (existingUser) {
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

    // Restituisce i dati aggiornati dell'utente con hasPassword
    const updatedUser = await User.findById(userId);
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
