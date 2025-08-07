import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import { isValidCodiceFiscale } from "../utils/codiceFiscale";
import { emailExists } from "../utils/emailHelper";

interface AuthenticatedRequest extends Request {
  user?: any;
}

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
    const { nome, cognome, codiceFiscale, biografia, email, password, oauthCode, fotoProfiloGoogle } = req.body;

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

    // Gestione foto profilo
    let fotoProfilo: { data?: string | Buffer, contentType?: string } = {};
    
    if (req.file) {
      // Foto caricata dall'utente
      fotoProfilo = {
        data: req.file.buffer.toString('base64'),
        contentType: req.file.mimetype,
      };
    } else if (fotoProfiloGoogle) {
      // Foto da Google
      try {
        const googlePhoto = JSON.parse(fotoProfiloGoogle);
        fotoProfilo = {
          data: googlePhoto.data,
          contentType: googlePhoto.contentType,
        };
      } catch (e) {
        console.error('Errore parsing foto Google:', e);
      }
    }

    // Crea un nuovo utente
    const newUser = new User({
      nome,
      cognome,
      codiceFiscale,
      biografia: biografia && biografia.trim() ? biografia.trim() : "Nessuna biografia fornita",
      ...(Object.keys(fotoProfilo).length > 0 && { fotoProfilo }),
      credenziali: {
        email,
        ...(hashedPassword && { password: hashedPassword }),
        ...(oauthCode && { oauthCode }),
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

// Ottieni i dati dell'utente corrente autenticato
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // Crea una versione sicura dell'utente senza la password ma con un flag che indica se esiste
    const safeUser = user.toObject();
    if (safeUser.credenziali) {
      const hasPassword = !!safeUser.credenziali.password;
      delete safeUser.credenziali.password;
      // Aggiungiamo un campo hasPassword invece di sovrascrivere password
      (safeUser.credenziali as any).hasPassword = hasPassword;
    }

    res.json(safeUser);
  } catch (error) {
    console.error("Errore nel recupero utente corrente:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};

// Aggiorna il profilo dell'utente corrente
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    const { nome, cognome, biografia } = req.body;

    // Validazioni
    if (!nome || !nome.trim()) {
      return res.status(400).json({ message: "Il nome è obbligatorio" });
    }

    if (!cognome || !cognome.trim()) {
      return res.status(400).json({ message: "Il cognome è obbligatorio" });
    }

    if (biografia && biografia.length > 500) {
      return res.status(400).json({ message: "La biografia non può superare i 500 caratteri" });
    }

    // Trova l'utente corrente
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // Aggiorna i dati (email non modificabile)
    user.nome = nome.trim();
    user.cognome = cognome.trim();
    user.biografia = biografia?.trim() || "";

    // Gestione foto profilo
    if (req.file) {
      user.fotoProfilo = {
        data: req.file.buffer.toString('base64'),
        contentType: req.file.mimetype,
      };
    }

    await user.save();

    // Rimuovi la password dalla risposta
    const updatedUser = await User.findById(userId).select("-credenziali.password");
    
    res.json({
      message: "Profilo aggiornato con successo",
      user: updatedUser
    });
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};

// Aggiorna la password dell'utente corrente
export const updatePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    const { newPassword } = req.body;

    // Validazioni
    if (!newPassword) {
      return res.status(400).json({ message: "La nuova password è obbligatoria" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "La password deve contenere almeno 6 caratteri" });
    }

    // Trova l'utente
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // Cripta la nuova password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Aggiorna la password
    if (!user.credenziali) {
      user.credenziali = { email: "", password: hashedPassword };
    } else {
      user.credenziali.password = hashedPassword;
    }

    await user.save();

    res.json({ message: "Password aggiornata con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento della password:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};