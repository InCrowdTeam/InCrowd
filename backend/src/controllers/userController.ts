import { Request, Response } from "express";
import User from "../models/User";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error("Errore nel recupero utenti:", error);
    res.status(500).json({ message: "Errore interno" });
  }
};
