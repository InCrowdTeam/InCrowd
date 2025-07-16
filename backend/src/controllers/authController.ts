import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersegreto"; // usa dotenv in produzione

export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ "credenziali.email": email });

    if (!user) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    if (!password || !user.credenziali.password) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.credenziali.password
    );

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

