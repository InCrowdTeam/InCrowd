import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error("Errore nel recupero utenti:", error);
    res.status(500).json({ message: "Errore interno" });
  }
};


export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(req.body);
    const { nome, cognome, biografia, email, password } = req.body;

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea un nuovo utente
    const newUser = new User({
      nome,
      cognome,
      biografia,
      fotoProfilo: {
        data: req.file?.buffer, // Salva il buffer dell'immagine
        contentType: req.file?.mimetype, // Salva il tipo MIME
      },
      credenziali: {
        email,
        password: hashedPassword,
      },
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Errore durante la creazione dell'utente:", error);
    res.status(500).json({ message: "Error creating user", error });
  }
};