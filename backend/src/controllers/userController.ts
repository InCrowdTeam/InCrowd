import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import { isValidCodiceFiscale } from "../utils/codiceFiscale";
import { emailExists } from "../utils/emailHelper";

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
    const { nome, cognome, codiceFiscale, biografia, email, password } = req.body;

    if (!isValidCodiceFiscale(codiceFiscale)) {
      res.status(400).json({ message: "Codice fiscale non valido" });
      return;
    }

    if (await emailExists(email)) {
      res.status(409).json({ message: "Email già registrata" });
      return;
    }

    // Hash della password se fornita
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    // Crea un nuovo utente
    const newUser = new User({
      nome,
      cognome,
      codiceFiscale,
      biografia,
      fotoProfilo: {
        data: req.file?.buffer,
        contentType: req.file?.mimetype,
      },
      credenziali: {
        email,
        ...(hashedPassword && { password: hashedPassword }),
      },
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Errore durante la creazione dell'utente:", error);
    res.status(500).json({ message: "Error creating user", error });
  }
};

export const getUtente = async (req: Request, res: Response) => {
  try {
    const utente = await User.findById(req.params.id).select("nome biografia fotoProfilo");
    if (!utente) return res.status(404).json({ message: "Utente non trovato" });

    let fotoProfiloUrl = "";
    if (utente.fotoProfilo && utente.fotoProfilo.data && utente.fotoProfilo.contentType) {
      fotoProfiloUrl = `data:${utente.fotoProfilo.contentType};base64,${utente.fotoProfilo.data}`;
    }

    res.json({
      nome: utente.nome,
      biografia: utente.biografia,
      fotoProfiloUrl
    });
  } catch (err) {
    res.status(500).json({ message: "Errore nel recupero utente" });
  }
};