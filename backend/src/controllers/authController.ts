import 'dotenv/config'
import { Request, Response } from "express";
import User from "../models/User";
import Ente from "../models/Ente";
import Operatore from "../models/Operatore";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { findAccountByEmail } from "../utils/emailHelper";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminpass";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

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
  if (!idToken) return res.status(400).json({ message: 'Token mancante' });
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID not set in environment");
    }
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      return res.status(400).json({ message: 'Token non valido' });
    }

    const { user, ente, operatore, count } = await findAccountByEmail(payload.email);
    if (count > 1) {
      return res.status(409).json({ message: 'Email duplicata' });
    }
    let account: any = user || ente || operatore;
    let userType = 'user';
    if (ente) userType = 'ente';
    if (operatore) userType = 'operatore';

    if (!account) {
      account = new User({
        nome: payload.given_name || 'Google',
        cognome: payload.family_name || 'User',
        codiceFiscale: 'GOOGLEPLACEHOLDER',
        biografia: '',
        credenziali: { email: payload.email, oauthCode: payload.sub },
      });
      await account.save();
    } else if (!account.credenziali.oauthCode) {
      account.credenziali.oauthCode = payload.sub;
      await account.save();
    }

    const token = jwt.sign(
      { userId: account._id, email: account.credenziali.email, userType },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: account, userType });
  } catch (err) {
    res.status(500).json({ message: 'Errore login Google', error: err });
  }
};
