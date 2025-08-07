import 'dotenv/config'
import { Request, Response } from "express";
import User from "../models/User";
import Ente from "../models/Ente";
import Operatore from "../models/Operatore";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { findAccountByEmail } from "../utils/emailHelper";
import fetch from 'node-fetch';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminpass";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Funzione helper per scaricare e convertire immagine da URL a base64
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

export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password, oauthCode } = req.body;

  try {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { email, userType: "admin" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.json({ token, userType: "admin" });
    }

    const { user, ente, operatore, count } = await findAccountByEmail(email);
    if (count > 1) {
      return res.status(409).json({ message: "Email duplicata" });
    }

    const account: any = user || ente || operatore;
    let userType = "user";
    if (ente) userType = "ente";
    if (operatore) userType = "operatore";

    if (!account) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    if (account.credenziali.password) {
      if (!password) {
        return res.status(401).json({ message: "Credenziali non valide" });
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
        return res.status(401).json({ 
          message: "Password non impostata. Accedere con Google e impostare una password dalle impostazioni del profilo." 
        });
      }
      if (!oauthCode || oauthCode !== account.credenziali.oauthCode) {
        return res.status(401).json({ message: "Credenziali non valide" });
      }
    } else {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const token = jwt.sign(
      { userId: account._id, email: account.credenziali.email, userType },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token, user: account, userType });
  } catch (err) {
    return res.status(500).json({ message: "Errore del server", error: err });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: "Token mancante" });

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
      return res.status(400).json({ message: "Token non valido" });
    }

    const { user, ente, operatore, count } = await findAccountByEmail(
      payload.email
    );
    if (count > 1) {
      return res.status(409).json({ message: "Email duplicata" });
    }

    const account: any = user || ente || operatore;
    let userType = "user";
    if (ente) userType = "ente";
    if (operatore) userType = "operatore";

    if (!account) {
      // Scarica foto profilo da Google se disponibile
      let fotoProfilo = null;
      if (payload.picture) {
        fotoProfilo = await downloadImageAsBase64(payload.picture);
      }

      return res.status(404).json({
        message: "Account non registrato",
        needsRegistration: true,
        data: {
          email: payload.email,
          nome: payload.given_name || "",
          cognome: payload.family_name || "",
          oauthCode: payload.sub,
          fotoProfilo: fotoProfilo
        },
      });
    }

    if (!account.credenziali.oauthCode) {
      account.credenziali.oauthCode = payload.sub;
      await account.save();
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

    res.json({ token, user: account, userType });
  } catch (err: any) {
    const message = err?.message || err.toString();
    res.status(500).json({ message: `Errore login Google: ${message}` });
  }
};

// Collega un account Google a un utente esistente
export const linkGoogleAccount = async (req: Request, res: Response) => {
  const { idToken } = req.body;
  const userId = (req as any).user?.userId;

  if (!idToken) return res.status(400).json({ message: "Token mancante" });
  if (!userId) return res.status(401).json({ message: "Utente non autenticato" });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    if (!payload?.email || !payload.sub) {
      return res.status(400).json({ message: "Token non valido" });
    }

    // Verifica che l'email del token Google corrisponda a quella dell'utente
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    if (user.credenziali?.email !== payload.email) {
      return res.status(400).json({ 
        message: "L'email dell'account Google deve corrispondere a quella del profilo" 
      });
    }

    // Verifica che l'account Google non sia già collegato a un altro utente
    const existingUser = await User.findOne({
      "credenziali.oauthCode": payload.sub,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: "Questo account Google è già collegato a un altro profilo" 
      });
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

    res.json({ 
      message: "Account Google collegato con successo",
      user: await User.findById(userId).select("-credenziali.password")
    });
  } catch (err: any) {
    const message = err?.message || err.toString();
    res.status(500).json({ message: `Errore collegamento Google: ${message}` });
  }
};
