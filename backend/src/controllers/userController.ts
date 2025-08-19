import { Request, Response } from "express";
import Privato from "../models/Privato";
import Ente from "../models/Ente";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { isValidCodiceFiscale } from "../utils/codiceFiscale";
import { emailExists, createSafeCredentials } from "../utils/emailHelper";
import { validatePassword, sanitizeInput, validateEmail } from "../utils/passwordValidator";
import { apiResponse } from "../utils/responseFormatter";
import { FollowCountService } from "../utils/followCountService";

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Crea dati utente pubblici unificati per la visualizzazione
 * @param user - Oggetto utente dal database
 * @param userType - Tipo utente ('privato' | 'ente') 
 * @param followCounts - Contatori follow (opzionale)
 * @returns Oggetto con dati pubblici unificati con user_type
 */
const createPublicUser = (
  user: any, 
  userType: 'privato' | 'ente',
  followCounts?: { followersCount: number; followingCount: number }
) => {
  const publicData: any = {
    _id: user._id,
    user_type: userType, // Sempre presente e valorizzato
    nome: user.nome,
    biografia: user.biografia,
    fotoProfilo: user.fotoProfilo,
    createdAt: user.createdAt
  };

  // Campi specifici per tipo utente
  if (userType === 'privato') {
    publicData.cognome = user.cognome;
  } else if (userType === 'ente') {
    publicData.nome_org = user.nome_org;
  }

  // Aggiungi i contatori se disponibili
  if (followCounts) {
    publicData.followersCount = followCounts.followersCount;
    publicData.followingCount = followCounts.followingCount;
  }

  return publicData;
};

/**
 * Verifica se l'utente autenticato ha permessi per visualizzare dati completi
 * @param requestUser - Oggetto utente dalla richiesta autenticata
 */
const canViewFullUserData = (requestUser: any) => {
  return requestUser && (requestUser.userType === 'operatore' || requestUser.userType === 'admin');
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
 * GET /api/user - Recupera tutti gli utenti (solo per operatori/admin)
 */
export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!canViewFullUserData(req.user)) {
      return res.status(403).json(
        apiResponse({ message: "Accesso negato. Permessi amministrativi richiesti" })
      );
    }

    // Recupera entrambi i tipi di utente
    const privati = await Privato.find();
    const enti = await Ente.find();

    // Unifica i risultati con user_type
    const allUsers = [
      ...privati.map(user => createPublicUser(user, 'privato')),
      ...enti.map(ente => createPublicUser(ente, 'ente'))
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
      nome_org, // Solo per enti  
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

    if (user_type === 'ente' && !nome_org) {
      return res.status(400).json(
        apiResponse({ message: "nome_org obbligatorio per enti" })
      );
    }

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

    if (!isValidCodiceFiscale(codiceFiscale)) {
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

    // TODO: validazione oauthCode se necessario (es. verifica lato Google)

    // Crea utente nel modello appropriato
    let newUser: any;
    if (user_type === 'privato') {
      newUser = new Privato({
        nome: sanitizeInput(nome),
        cognome: sanitizeInput(cognome),
        codiceFiscale: sanitizeInput(codiceFiscale),
        biografia: biografia ? sanitizeInput(biografia) : "",
        credenziali: {
          email: email.toLowerCase(),
          password: hashedPassword,
          oauthCode: oauthCode || undefined
        }
      });
    } else {
      newUser = new Ente({
        nome_org: sanitizeInput(nome_org),
        nome: nome ? sanitizeInput(nome) : undefined,
        codiceFiscale: sanitizeInput(codiceFiscale),
        biografia: biografia ? sanitizeInput(biografia) : "",
        credenziali: {
          email: email.toLowerCase(),
          password: hashedPassword,
          oauthCode: oauthCode || undefined
        }
      });
    }

    await newUser.save();

    // Risposta con dati pubblici
    const publicUser = createPublicUser(newUser, user_type);
    
    res.status(201).json(
      apiResponse({
        message: "Utente creato con successo",
        data: { user: publicUser }
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

    // Conta followers/following
    const followCounts = await FollowCountService.getBothCounts(userId);
    
    const publicUser = createPublicUser(user, userType, followCounts);
    
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
    const followCounts = await FollowCountService.getBothCounts(userId);
    
    // Per il profilo personale, include tutti i dati (tranne password)
    const safeUser = createSafeCredentials(user);
    const completeUser = {
      ...safeUser,
      user_type: userType,
      followersCount: followCounts.followersCount,
      followingCount: followCounts.followingCount
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
    const allowedEnteFields = ['nome_org'];

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
    } else if (userType === 'ente') {
      allowedEnteFields.forEach(field => {
        if (updates[field] !== undefined) {
          (user as any)[field] = sanitizeInput(updates[field]);
        }
      });
    }

    await user.save();

    // Risposta con dati aggiornati
    const publicUser = createPublicUser(user, userType);
    
    res.json(
      apiResponse({
        message: "Profilo aggiornato con successo",
        data: { user: publicUser }
      })
    );

  } catch (err: any) {
    res.status(500).json(
      apiResponse({ message: `Errore aggiornamento profilo: ${err.message}` })
    );
  }
};

/**
 * DELETE /api/user/account - Elimina account utente
 */
export const deleteAccount = async (req: any, res: Response) => {
  try {
    const { userId, userType } = req.user;

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
      apiResponse({ message: "Account eliminato con successo" })
    );

  } catch (err: any) {
    res.status(500).json(
      apiResponse({ message: `Errore eliminazione account: ${err.message}` })
    );
  }
};

/**
 * GET /api/user/search - Cerca utenti
 */
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q, limit = 10, page = 1, user_type } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json(
        apiResponse({ message: "Query di ricerca richiesta (minimo 2 caratteri)" })
      );
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const limitNum = Math.min(parseInt(limit as string) || 10, 50);
    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

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
        { nome_org: searchRegex },
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
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const privateResults = privati.map(user => createPublicUser(user, 'privato'));
      results = results.concat(privateResults);

      if (!user_type) {
        totalCount += await Privato.countDocuments(privateQuery);
      }
    }

    if (!user_type || user_type === 'ente') {
      const enti = await Ente.find(enteQuery)
        .select('nome_org nome biografia fotoProfilo createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const enteResults = enti.map(ente => createPublicUser(ente, 'ente'));
      results = results.concat(enteResults);

      if (!user_type) {
        totalCount += await Ente.countDocuments(enteQuery);
      }
    }

    // Ordina i risultati unificati per data
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Limita se necessario
    if (!user_type) {
      results = results.slice(0, limitNum);
    }

    res.json(
      apiResponse({
        message: "Ricerca completata",
        data: {
          users: results,
          total: user_type ? results.length : totalCount,
          page: pageNum,
          limit: limitNum
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
