import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || "supersegreto"; // usa dotenv in produzione

export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ "credenziali.email": email });

    if (!user) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const passwordMatch = await bcrypt.compare(password, user.credenziali.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.credenziali.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ message: "Errore del server", error: err });
  }
};

export const loginWithGoogle = async (req: Request, res: Response): Promise<any> => {
  const { idToken } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(401).json({ message: "Token non valido" });
    }

    const email = payload.email;
    let user = await User.findOne({ "credenziali.email": email });

    if (!user) {
      const randomPass = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPass, 10);

      user = new User({
        nome: payload.given_name || "",
        cognome: payload.family_name || "",
        biografia: "Google user",
        fotoProfilo: {
          data: "",
          contentType: "",
        },
        credenziali: {
          email,
          password: hashedPassword,
        },
      });

      await user.save();
    }

    const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({ token, user });
  } catch (err) {
    return res.status(401).json({ message: "Token non valido", error: err });
  }
};

