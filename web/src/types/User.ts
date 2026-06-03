import type { IAllegato } from "./Allegato";
import type { ICredenziali } from "./Credenziali";

export interface IUser {
  _id: string
  nome: string;
  cognome?: string;  // Opzionale per gli enti
  codiceFiscale: string;
  biografia?: string;
  fotoProfilo: IAllegato;
  credenziali: ICredenziali;
  createdAt: Date;
  updatedAt: Date;
  followersCount?: number;  // Contatore dinamico
  followingCount?: number;  // Contatore dinamico
  isFollowedByCurrentUser?: boolean;
  userType?: 'privato' | 'ente';  // Campo per distinguere tra utente privato ed ente (legacy)
  user_type?: 'privato' | 'ente';  // Campo unificato dall'API
}

// Tipi per le API di autenticazione
export interface LoginCredentials {
  email: string;
  password?: string;
  oauthCode?: string;
}

export interface GoogleLoginData {
  idToken: string;
}

export interface SignupData {
  nome: string;
  cognome?: string;
  codiceFiscale: string;
  biografia?: string;
  credenziali: ICredenziali;
}