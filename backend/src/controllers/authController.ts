import { Request, Response } from "express";
import User from "../models/User";
import Ente from "../models/Ente";
import Operatore from "../models/Operatore";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersegreto"; // usa dotenv in produzione

export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password, oauthCode } = req.body;

  try {
    let user: any = await User.findOne({ "credenziali.email": email });
    let userType = "user";

    if (!user) {
      user = await Ente.findOne({ "credenziali.email": email });
      if (user) userType = "ente";
    }

    if (!user) {
      user = await Operatore.findOne({ "credenziali.email": email });
      if (user) userType = "operatore";
    }

    if (!user) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    if (user.credenziali.password) {
      if (!password) {
        return res.status(401).json({ message: "Credenziali non valide" });
      }
      const passwordMatch = await bcrypt.compare(
        password,
        user.credenziali.password
      );
      if (!passwordMatch) {
        return res.status(401).json({ message: "Credenziali non valide" });
      }
    } else if (user.credenziali.oauthCode) {
      if (!oauthCode || oauthCode !== user.credenziali.oauthCode) {
        return res.status(401).json({ message: "Credenziali non valide" });
      }
    } else {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.credenziali.email, userType },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ token, user, userType });
  } catch (err) {
    return res.status(500).json({ message: "Errore del server", error: err });
  }
};

