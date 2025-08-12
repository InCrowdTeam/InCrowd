import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import { isValidCodiceFiscale } from "../utils/codiceFiscale";
import { emailExists } from "../utils/emailHelper";
import { validatePassword, sanitizeInput, validateEmail } from "../utils/passwordValidator";
import { apiResponse } from "../utils/responseFormatter";

interface AuthenticatedRequest extends Request {
  user?: any;
}

// ...existing code...

// Helper function per creare un oggetto utente sicuro con hasPassword
const createSafeUser = (user: any) => {
  const safeUser = user.toObject();
  if (safeUser.credenziali) {
    const hasPassword = !!safeUser.credenziali.password;
    delete safeUser.credenziali.password;
    (safeUser.credenziali as any).hasPassword = hasPassword;
  }
  return safeUser;
};

// Helper function per creare dati utente pubblici (limitati)
const createPublicUser = (user: any) => {
  return {
    _id: user._id,
    nome: user.nome,
    cognome: user.cognome,
    biografia: user.biografia,
    fotoProfilo: user.fotoProfilo,
    createdAt: user.createdAt
  };
};

// Verifica se l'utente ha permessi per vedere tutti i dati
const canViewFullUserData = (requestUser: any) => {
  return requestUser && (requestUser.userType === 'operatore' || requestUser.userType === 'admin');
};

// SOLO per operatori e admin - Lista completa utenti
export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Verifica autorizzazione
    if (!canViewFullUserData(req.user)) {
  return res.status(403).json(apiResponse({ message: "Accesso negato. Solo operatori e amministratori possono visualizzare tutti gli utenti." }));
    }

    const users = await User.find();
  res.json(apiResponse({ data: users, message: "Lista utenti" }));
  } catch (error) {
    console.error("Errore nel recupero utenti:", error);
  res.status(500).json(apiResponse({ message: "Errore interno del server", error }));
  }
};


export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, cognome, codiceFiscale, biografia, email, password, oauthCode, fotoProfiloGoogle } = req.body;

    // Validazioni input obbligatori
    if (!nome || !nome.trim()) {
  res.status(400).json(apiResponse({ message: "Il nome è obbligatorio" }));
      return;
    }

    if (!cognome || !cognome.trim()) {
  res.status(400).json(apiResponse({ message: "Il cognome è obbligatorio" }));
      return;
    }

    if (!codiceFiscale || !codiceFiscale.trim()) {
  res.status(400).json(apiResponse({ message: "Il codice fiscale è obbligatorio" }));
      return;
    }

    if (!email || !email.trim()) {
  res.status(400).json(apiResponse({ message: "L'email è obbligatoria" }));
      return;
    }

    // Sanitizza gli input
    const sanitizedNome = sanitizeInput(nome);
    const sanitizedCognome = sanitizeInput(cognome);
    const sanitizedBiografia = biografia ? sanitizeInput(biografia) : "";
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedCodiceFiscale = codiceFiscale.trim().toUpperCase();

    // Controlli di sicurezza solo se abilitati
    const securityEnabled = process.env.ENABLE_SECURITY_CONTROLS !== 'false';
    
    if (securityEnabled) {
      // Validazioni specifiche
      if (!validateEmail(sanitizedEmail)) {
    res.status(400).json(apiResponse({ message: "Formato email non valido" }));
        return;
      }

      if (!isValidCodiceFiscale(sanitizedCodiceFiscale)) {
    res.status(400).json(apiResponse({ message: "Codice fiscale non valido" }));
        return;
      }
    }

    if (await emailExists(sanitizedEmail)) {
    res.status(409).json(apiResponse({ message: "Email già registrata" }));
      return;
    }

    // Validazione password (solo se fornita e non OAuth)
    let hashedPassword: string | undefined = undefined;
    if (password && !oauthCode) {
      const securityEnabled = process.env.ENABLE_SECURITY_CONTROLS !== 'false';
      
      if (securityEnabled) {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          res.status(400).json(apiResponse({ message: "Password non valida", error: passwordValidation.errors }));
          return;
        }
      }
      hashedPassword = await bcrypt.hash(password, 10); // Torniamo a 10 rounds
    }

    // Gestione foto profilo
    let fotoProfilo: { data?: string | Buffer, contentType?: string } = {};
    
    if (req.file) {
      // Validazione semplice foto profilo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
  res.status(400).json(apiResponse({ message: "Tipo di file non supportato. Usa JPEG, PNG o GIF." }));
        return;
      }
      
      // Controllo dimensione massima 5MB
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (req.file.size > maxSize) {
  res.status(400).json(apiResponse({ message: "File troppo grande. Dimensione massima: 5MB" }));
        return;
      }
      
      // Usa l'immagine originale senza compressione
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
      nome: sanitizedNome,
      cognome: sanitizedCognome,
      codiceFiscale: sanitizedCodiceFiscale,
      biografia: sanitizedBiografia,
      ...(Object.keys(fotoProfilo).length > 0 && { fotoProfilo }),
      credenziali: {
        email: sanitizedEmail,
        ...(hashedPassword && { password: hashedPassword }),
        ...(oauthCode && { oauthCode }),
      },
    });

    await newUser.save();
    const safeUser = createSafeUser(newUser);
  res.status(201).json(apiResponse({ data: safeUser, message: "Utente creato con successo" }));
  } catch (error) {
    console.error("Errore durante la creazione dell'utente:", error);
  res.status(500).json(apiResponse({ message: "Errore nella creazione dell'utente", error }));
  }
};

// Nuovo endpoint sicuro per ottenere un utente specifico
export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
  return res.status(404).json(apiResponse({ message: "Utente non trovato" }));
    }

    // Se l'utente è autenticato ed è operatore/admin, restituisce dati completi
    if (canViewFullUserData(req.user)) {
      const safeUser = createSafeUser(user);
  return res.json(apiResponse({ data: safeUser, message: "Utente trovato" }));
    }

    // Altrimenti restituisce solo dati pubblici
    const publicUser = createPublicUser(user);
  res.json(apiResponse({ data: publicUser, message: "Dati pubblici utente" }));
  } catch (error) {
    console.error("Errore nel recupero utente:", error);
  res.status(500).json(apiResponse({ message: "Errore interno del server", error }));
  }
};

// Endpoint pubblico per ottenere solo l'avatar di un utente
export const getUserAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("fotoProfilo nome");
    
    if (!user) {
  return res.status(404).json(apiResponse({ message: "Utente non trovato" }));
    }

    if (!user.fotoProfilo || !user.fotoProfilo.data) {
  return res.status(404).json(apiResponse({ message: "Avatar non disponibile" }));
    }

    // Prepara l'URL dell'avatar
    let avatarUrl = "";
    if (user.fotoProfilo.data && user.fotoProfilo.contentType) {
      // Assicuriamoci che i dati siano correttamente convertiti in base64
      let base64Data = user.fotoProfilo.data;
      if (Buffer.isBuffer(user.fotoProfilo.data)) {
        base64Data = user.fotoProfilo.data.toString('base64');
      }
      avatarUrl = `data:${user.fotoProfilo.contentType};base64,${base64Data}`;
    }

    res.json(apiResponse({
      data: {
        userId: user._id,
        nome: user.nome,
        avatarUrl
      },
      message: "Avatar utente"
    }));
  } catch (error) {
    console.error("Errore nel recupero avatar:", error);
  res.status(500).json(apiResponse({ message: "Errore interno del server", error }));
  }
};

export const getUtente = async (req: Request, res: Response) => {
  try {
    const utente = await User.findById(req.params.id).select("nome biografia fotoProfilo");
  if (!utente) return res.status(404).json(apiResponse({ message: "Utente non trovato" }));

    let fotoProfiloUrl = "";
    if (utente.fotoProfilo && utente.fotoProfilo.data && utente.fotoProfilo.contentType) {
      // Assicuriamoci che i dati siano correttamente convertiti in base64
      let base64Data = utente.fotoProfilo.data;
      if (Buffer.isBuffer(utente.fotoProfilo.data)) {
        base64Data = utente.fotoProfilo.data.toString('base64');
      }
      fotoProfiloUrl = `data:${utente.fotoProfilo.contentType};base64,${base64Data}`;
    }

    res.json(apiResponse({
      data: {
        nome: utente.nome,
        biografia: utente.biografia,
        fotoProfiloUrl
      },
      message: "Dati pubblici utente"
    }));
  } catch (err) {
  res.status(500).json(apiResponse({ message: "Errore nel recupero utente", error: err }));
  }
};

// Ottieni i dati dell'utente corrente autenticato
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
  return res.status(401).json(apiResponse({ message: "Utente non autenticato" }));
    }

    const user = await User.findById(userId);
    if (!user) {
  return res.status(404).json(apiResponse({ message: "Utente non trovato" }));
    }

    // Crea una versione sicura dell'utente senza la password ma con un flag che indica se esiste
    const safeUser = createSafeUser(user);

  res.json(apiResponse({ data: safeUser, message: "Utente corrente" }));
  } catch (error) {
    console.error("Errore nel recupero utente corrente:", error);
  res.status(500).json(apiResponse({ message: "Errore interno del server", error }));
  }
};

// Aggiorna il profilo dell'utente corrente
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
  return res.status(401).json(apiResponse({ message: "Utente non autenticato" }));
    }

    const { nome, cognome, biografia } = req.body;

    // Validazioni
    if (!nome || !nome.trim()) {
  return res.status(400).json(apiResponse({ message: "Il nome è obbligatorio" }));
    }

    if (!cognome || !cognome.trim()) {
  return res.status(400).json(apiResponse({ message: "Il cognome è obbligatorio" }));
    }

    if (biografia && biografia.length > 500) {
  return res.status(400).json(apiResponse({ message: "La biografia non può superare i 500 caratteri" }));
    }

    // Trova l'utente corrente
    const user = await User.findById(userId);
    if (!user) {
  return res.status(404).json(apiResponse({ message: "Utente non trovato" }));
    }

    // Aggiorna i dati (email non modificabile)
    user.nome = nome.trim();
    user.cognome = cognome.trim();
    user.biografia = biografia?.trim() || "";

    // Gestione foto profilo
    if (req.file) {
      // Validazione semplice foto profilo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
  return res.status(400).json(apiResponse({ message: "Tipo di file non supportato. Usa JPEG, PNG o GIF." }));
      }
      
      // Controllo dimensione massima 5MB
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (req.file.size > maxSize) {
  return res.status(400).json(apiResponse({ message: "File troppo grande. Dimensione massima: 5MB" }));
      }
      
      // Usa l'immagine originale senza compressione
      user.fotoProfilo = {
        data: req.file.buffer.toString('base64'),
        contentType: req.file.mimetype,
      };
    }

    await user.save();

    // Restituisce i dati aggiornati dell'utente con hasPassword
    const updatedUser = await User.findById(userId);
    const safeUser = createSafeUser(updatedUser!);
    
  res.json(apiResponse({ data: safeUser, message: "Profilo aggiornato con successo" }));
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo:", error);
  res.status(500).json(apiResponse({ message: "Errore interno del server", error }));
  }
};

// Aggiorna la password dell'utente corrente
export const updatePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
  return res.status(401).json(apiResponse({ message: "Utente non autenticato" }));
    }

    const { newPassword } = req.body;

    // Validazioni con i nuovi standard
    if (!newPassword) {
  return res.status(400).json(apiResponse({ message: "La nuova password è obbligatoria" }));
    }

    const securityEnabled = process.env.ENABLE_SECURITY_CONTROLS !== 'false';
    
    if (securityEnabled) {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json(apiResponse({ message: "Password non valida", error: passwordValidation.errors }));
      }
    }

    // Trova l'utente
    const user = await User.findById(userId);
    if (!user) {
  return res.status(404).json(apiResponse({ message: "Utente non trovato" }));
    }

    // Cripta la nuova password con 10 rounds
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Aggiorna la password
    if (!user.credenziali) {
      user.credenziali = { email: "", password: hashedPassword };
    } else {
      user.credenziali.password = hashedPassword;
    }

    await user.save();

    // Restituisce i dati aggiornati dell'utente con hasPassword
    const updatedUser = await User.findById(userId);
    const safeUser = createSafeUser(updatedUser!);

  res.json(apiResponse({ data: safeUser, message: "Password aggiornata con successo" }));
  } catch (error) {
    console.error("Errore nell'aggiornamento della password:", error);
  res.status(500).json(apiResponse({ message: "Errore interno del server", error }));
  }
};