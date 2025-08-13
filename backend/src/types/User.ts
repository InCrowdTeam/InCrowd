import { IAllegato } from "./Allegato";
import { ICredenziali } from "./Credenziali";

export interface IUser {
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
  isFollowedByCurrentUser?: boolean; // per la response API
};