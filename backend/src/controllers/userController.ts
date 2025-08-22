import 'dotenv/config'
import { Request, Response } from "express";
import Privato from "../models/Privato";
import Ente from "../models/Ente";
import Proposta from "../models/Proposta";
import Commento from "../models/Commento";
import Follow from "../models/Follow";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fetch from 'node-fetch';
import { isValidCodiceFiscale } from "../utils/codiceFiscale";
import { emailExists, createSafeCredentials } from "../utils/emailHelper";
import { validatePassword, sanitizeInput, validateEmail } from "../utils/passwordValidator";
import { apiResponse } from "../utils/responseFormatter";

// Configurazione JWT
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Crea dati utente pubblici unificati per la visualizzazione
 * @param user - Oggetto utente dal database
 * @param userType - Tipo utente ('privato' | 'ente') 
 * @param requestUser - Utente autenticato che fa la richiesta (opzionale)
 * @returns Oggetto con dati pubblici unificati con user_type
 */
const createPublicUser = (
  user: any, 
  userType: 'privato' | 'ente',
  requestUser?: any
) => {
  const isOperator = requestUser && requestUser.userType === 'operatore';
  
  const publicData: any = {
    _id: user._id,
    user_type: userType, // Sempre presente e valorizzato
    nome: user.nome,
    biografia: user.biografia,
    fotoProfilo: user.fotoProfilo,
    createdAt: user.createdAt
  };

  // Email e dati sensibili solo per operatori
  if (isOperator) {
    publicData.email = user.credenziali?.email;
    publicData.codiceFiscale = user.codiceFiscale;
  }

  // Campi specifici per tipo utente
  if (userType === 'privato') {
    publicData.cognome = user.cognome;
  }
  // nome is now common for both user types

  return publicData;
};

/**
 * Verifica se l'utente autenticato ha permessi per visualizzare dati completi
 * @param requestUser - Oggetto utente dalla richiesta autenticata
 */
const canViewFullUserData = (requestUser: any) => {
  return requestUser && requestUser.userType === 'operatore';
};

/**
 * Trova un utente per ID cercando in entrambe le collezioni
 * @param userId - ID dell'utente da cercare
 * @returns Oggetto con user e userType, o null se non trovato
 */
const findUserById = async (userId: string) => {
  let user = await Privato.findById(userId);
  if (user) {
    return { user, userType: 'privato' as const };
  }
  
  user = await Ente.findById(userId);
  if (user) {
    return { user, userType: 'ente' as const };
  }
  
  return null;
};

/**
 * GET /api/user - Recupera tutti gli utenti (solo per operatori)
 */
export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!canViewFullUserData(req.user)) {
      return res.status(403).json(
        apiResponse({ message: "Accesso negato. Permessi amministrativi richiesti" })
      );
    }

    // Recupera entrambi i tipi di utente
  const privati = await Privato.find().select('nome cognome biografia fotoProfilo createdAt credenziali');
  const enti = await Ente.find().select('nome biografia fotoProfilo createdAt credenziali');

    // Unifica i risultati con user_type
    const allUsers = [
      ...privati.map(user => createPublicUser(user, 'privato', req.user)),
      ...enti.map(ente => createPublicUser(ente, 'ente', req.user))
    ];

    res.json(
      apiResponse({
        message: "Utenti recuperati con successo",
        data: { users: allUsers, total: allUsers.length }
      })
    );
  } catch (err: any) {
    res.status(500).json(
      apiResponse({ message: `Errore recupero utenti: ${err.message}` })
    );
  }
};

/**
 * POST /api/user - Crea nuovo utente (privato o ente)
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      user_type, // Obbligatorio: 'privato' | 'ente'
      nome,
      cognome, // Solo per privati
      codiceFiscale,
      biografia,
      email,
      password,
      oauthCode
    } = req.body;

    // Validazioni base
    if (!user_type || !['privato', 'ente'].includes(user_type)) {
      return res.status(400).json(
        apiResponse({ message: "user_type obbligatorio e deve essere 'privato' o 'ente'" })
      );
    }

    if (!nome || !codiceFiscale || !email) {
      return res.status(400).json(
        apiResponse({ message: "nome, codiceFiscale ed email sono obbligatori" })
      );
    }

    // Serve almeno uno tra password e oauthCode
    if (!password && !oauthCode) {
      return res.status(400).json(
        apiResponse({ message: "Devi fornire una password oppure un oauthCode" })
      );
    }
    if (password && oauthCode) {
      return res.status(400).json(
        apiResponse({ message: "Non puoi fornire sia password che oauthCode" })
      );
    }

    // Validazioni specifiche per tipo
    if (user_type === 'privato' && !cognome) {
      return res.status(400).json(
        apiResponse({ message: "cognome obbligatorio per utenti privati" })
      );
    }

    // nome is now required for enti (it's the organization name)

    // Validazioni email e codice fiscale
    if (!validateEmail(email)) {
      return res.status(400).json(
        apiResponse({ message: "Formato email non valido" })
      );
    }

    const existingEmail = await emailExists(email);
    if (existingEmail) {
      return res.status(409).json(
        apiResponse({ message: "Email già registrata" })
      );
    }

    // Validazione codice fiscale solo per privati
    if (user_type === 'privato' && !isValidCodiceFiscale(codiceFiscale)) {
      return res.status(400).json(
        apiResponse({ message: "Codice fiscale non valido" })
      );
    }

    let hashedPassword = undefined;
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json(
          apiResponse({
            message: "Password non valida",
            error: { details: passwordValidation.errors }
          })
        );
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Gestione foto profilo (file upload o foto Google)
    let fotoProfilo = undefined;
    
    if (req.file) {
      // Validazione dimensione file
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json(
          apiResponse({ message: "Il file immagine è troppo grande (max 5MB)" })
        );
      }

      // Validazione tipo file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json(
          apiResponse({ message: "Formato file non supportato. Usa JPEG, PNG, GIF o WebP" })
        );
      }

      fotoProfilo = {
        data: req.file.buffer.toString('base64'),
        contentType: req.file.mimetype
      };
    } else if (req.body.fotoProfiloGoogle) {
      // Gestione foto di Google (URL)
      try {
        const response = await fetch(req.body.fotoProfiloGoogle);
        if (response.ok) {
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          
          fotoProfilo = {
            data: base64,
            contentType
          };
        }
      } catch (error) {
        console.error('Errore download foto Google:', error);
      }
    }

    // Crea utente nel modello appropriato
    let newUser: any;
    if (user_type === 'privato') {
      newUser = new Privato({
        nome: sanitizeInput(nome),
        cognome: sanitizeInput(cognome),
        codiceFiscale: sanitizeInput(codiceFiscale),
        biografia: biografia ? sanitizeInput(biografia) : "",
        fotoProfilo: fotoProfilo,
        credenziali: {
          email: email.toLowerCase(),
          password: hashedPassword,
          oauthCode: oauthCode || undefined
        }
      });
    } else {
      newUser = new Ente({
        nome: sanitizeInput(nome), // nome is now the organization name
        codiceFiscale: sanitizeInput(codiceFiscale),
        biografia: biografia ? sanitizeInput(biografia) : "",
        fotoProfilo: fotoProfilo,
        credenziali: {
          email: email.toLowerCase(),
          password: hashedPassword,
          oauthCode: oauthCode || undefined
        }
      });
    }

    await newUser.save();

    // Genera token JWT per login automatico
    const token = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.credenziali.email, 
        userType: user_type 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Risposta con dati pubblici e token
    const publicUser = createPublicUser(newUser, user_type, undefined);
    
    res.status(201).json(
      apiResponse({
        message: "Utente creato con successo",
        data: { 
          user: publicUser,
          token: token,
          userType: user_type
        }
      })
    );

  } catch (err: any) {
    res.status(500).json(
      apiResponse({ message: `Errore creazione utente: ${err.message}` })
    );
  }
};

/**
 * GET /api/user/:id - Recupera utente per ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const result = await findUserById(userId);

    if (!result) {
      return res.status(404).json(
        apiResponse({ message: "Utente non trovato" })
      );
    }

    const { user, userType } = result;
    
    // Estrai utente autenticato se presente (per autenticazione opzionale)
    const authenticatedUser = (req as any).user;
    const publicUser = createPublicUser(user, userType, authenticatedUser);
    
    res.json(
      apiResponse({
        message: "Utente recuperato con successo",
        data: { user: publicUser }
      })
    );

  } catch (err: any) {
    res.status(500).json(
      apiResponse({ message: `Errore recupero utente: ${err.message}` })
    );
  }
};

/**
 * GET /api/user/me - Recupera profilo utente corrente
 */
export const getCurrentUser = async (req: any, res: Response) => {
  try {
    const { userId, userType } = req.user;
    const result = await findUserById(userId);

    if (!result) {
      return res.status(404).json(
        apiResponse({ message: "Utente non trovato" })
      );
    }

    const { user } = result;
    
    // Per il profilo personale, include tutti i dati (tranne password)
    const safeUser = createSafeCredentials(user);
    const completeUser = {
      ...safeUser,
      user_type: userType
    };

    res.json(
      apiResponse({
        message: "Profilo recuperato con successo",
        data: { user: completeUser }
      })
    );

  } catch (err: any) {
    res.status(500).json(
      apiResponse({ message: `Errore recupero profilo: ${err.message}` })
    );
  }
};

/**
 * PATCH /api/user/profile - Aggiorna profilo utente
 */
export const updateProfile = async (req: any, res: Response) => {
  try {
    const { userId, userType } = req.user;
    const updates = req.body;

    // Trova utente
    const result = await findUserById(userId);
    if (!result) {
      return res.status(404).json(
        apiResponse({ message: "Utente non trovato" })
      );
    }

    const { user } = result;

    // Campi aggiornabili comuni
    const allowedCommonFields = ['nome', 'biografia'];
    const allowedPrivateFields = ['cognome'];
    // nome is now a common field for both user types

    // Applica aggiornamenti sicuri
    allowedCommonFields.forEach(field => {
      if (updates[field] !== undefined) {
        (user as any)[field] = sanitizeInput(updates[field]);
      }
    });

    // Campi specifici per tipo
    if (userType === 'privato') {
      allowedPrivateFields.forEach(field => {
        if (updates[field] !== undefined) {
          (user as any)[field] = sanitizeInput(updates[field]);
        }
      });
    }
    // nome is now handled in allowedCommonFields for both user types

    // Gestione upload foto profilo
    if (req.file) {
      // Validazione dimensione file (già gestita da multer ma aggiungiamo controllo)
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json(
          apiResponse({ message: "Il file immagine è troppo grande (max 5MB)" })
        );
      }

      // Validazione tipo file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json(
          apiResponse({ message: "Formato file non supportato. Usa JPEG, PNG, GIF o WebP" })
        );
      }

      const fotoProfilo = {
        data: req.file.buffer.toString('base64'),
        contentType: req.file.mimetype
      };
      (user as any).fotoProfilo = fotoProfilo;
    }
    
    // Gestione rimozione foto profilo (se viene inviato un campo removeFotoProfilo)
    if (updates.removeFotoProfilo === 'true' || updates.removeFotoProfilo === true) {
      (user as any).fotoProfilo = undefined;
    }

    await user.save();

    // Risposta con dati completi dell'utente (come getCurrentUser)
    const safeUser = createSafeCredentials(user);
    const completeUser = {
      ...safeUser,
      user_type: userType
    };
    
    res.json(
      apiResponse({
        message: "Profilo aggiornato con successo",
        data: { user: completeUser }
      })
    );

  } catch (err: any) {
    res.status(500).json(
      apiResponse({ message: `Errore aggiornamento profilo: ${err.message}` })
    );
  }
};

/**
 * DELETE /api/user/account - Elimina account utente e tutti i dati associati
 */
export const deleteAccount = async (req: any, res: Response) => {
  try {
    const { userId, userType } = req.user;

    // Prima elimina tutti i dati associati all'utente
    // 1. Elimina tutte le proposte dell'utente
    await Proposta.deleteMany({ proponenteID: userId });
    
    // 2. Elimina tutti i commenti dell'utente
    await Commento.deleteMany({ utente: userId });
    
    // 3. Elimina tutti i follow dove l'utente è coinvolto (follower o followed)
    await Follow.deleteMany({ 
      $or: [
        { follower: userId },
        { followed: userId }
      ]
    });

    // 4. Rimuovi l'utente da tutte le liste di hype delle proposte
    await Proposta.updateMany(
      { listaHyper: userId },
      { $pull: { listaHyper: userId } }
    );

    // 5. Infine elimina l'account utente
    let deleted: any;
    if (userType === 'ente') {
      deleted = await Ente.findByIdAndDelete(userId);
    } else {
      deleted = await Privato.findByIdAndDelete(userId);
    }

    if (!deleted) {
      return res.status(404).json(
        apiResponse({ message: "Utente non trovato" })
      );
    }

    res.json(
      apiResponse({ message: "Account e tutti i dati associati eliminati con successo" })
    );

  } catch (err: any) {
    res.status(500).json(
      apiResponse({ message: `Errore eliminazione account: ${err.message}` })
    );
  }
};

/**
 * GET /api/user/search - Ricerca utenti
 */
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q, user_type, limit = 10, page = 1 } = req.query;
    
    // Estrai utente autenticato se presente (per autenticazione opzionale)
    const authenticatedUser = (req as any).user;

    if (!q || q.toString().trim().length < 2) {
      return res.status(400).json(
        apiResponse({ message: "Query di ricerca richiesta (minimo 2 caratteri)" })
      );
    }

    const searchRegex = new RegExp(q.toString().trim(), 'i');

    // Query per privati
    const privateQuery = {
      $or: [
        { nome: searchRegex },
        { cognome: searchRegex },
        { biografia: searchRegex }
      ]
    };

    // Query per enti
    const enteQuery = {
      $or: [
        { nome: searchRegex },
        { biografia: searchRegex }
      ]
    };

    let results: any[] = [];
    let totalCount = 0;

    // Cerca in base al filtro user_type
    if (!user_type || user_type === 'privato') {
      const privati = await Privato.find(privateQuery)
        .select('nome cognome biografia fotoProfilo createdAt')
        .sort({ createdAt: -1 });

      const privateResults = privati.map(user => createPublicUser(user, 'privato', authenticatedUser));
      results = results.concat(privateResults);

      if (!user_type) {
        totalCount += await Privato.countDocuments(privateQuery);
      }
    }

    if (!user_type || user_type === 'ente') {
      const enti = await Ente.find(enteQuery)
        .select('nome biografia fotoProfilo createdAt')
        .sort({ createdAt: -1 });

      const enteResults = enti.map(ente => createPublicUser(ente, 'ente', authenticatedUser));
      results = results.concat(enteResults);

      if (!user_type) {
        totalCount += await Ente.countDocuments(enteQuery);
      }
    }

    // Ordina i risultati unificati per data
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(
      apiResponse({
        message: "Ricerca completata",
        data: {
          users: results,
          total: user_type ? results.length : totalCount
        }
      })
    );

  } catch (err: any) {
    res.status(500).json(
      apiResponse({ message: `Errore ricerca utenti: ${err.message}` })
    );
  }
};

// Funzioni legacy mantenute per compatibilità con le route esistenti
// Queste dovrebbero essere migrate man mano

/**
 * @deprecated - Usare getUserById invece
 */
export const getUtente = getUserById;

/**
 * @deprecated - Non implementata nel nuovo sistema unificato
 */
export const getUserAvatar = async (req: Request, res: Response) => {
  try {
    const result = await findUserById(req.params.id);
    
    if (!result || !result.user.fotoProfilo) {
      return res.status(404).json(
        apiResponse({ message: "Avatar non trovato" })
      );
    }

    const { user } = result;
    const fotoProfilo = user.fotoProfilo;
    
    res.json(
      apiResponse({
        message: "Avatar recuperato",
        data: { fotoProfilo }
      })
    );

  } catch (err: any) {
    res.status(500).json(
      apiResponse({ message: `Errore recupero avatar: ${err.message}` })
    );
  }
};

/**
/**
 * @deprecated - Le password sono gestite in /api/auth/password
 */
export const updatePassword = async (req: any, res: Response) => {
  res.status(404).json(
    apiResponse({
      message: "Endpoint spostato a PATCH /api/auth/password"
    })
  );
};
