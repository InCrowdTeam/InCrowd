import type { IAllegato } from "./Allegato";
import type { ICredenziali } from "./Credenziali";

export interface IUser {
  _id: string
  nome: string;
  cognome: string;
  codiceFiscale: string;
  biografia?: string;
  fotoProfilo: IAllegato;
  credenziali: ICredenziali;
  createdAt: Date;
  updatedAt: Date;
  followers: number;
  following: number;
  isFollowedByCurrentUser?: boolean;
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