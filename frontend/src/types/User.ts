import type { IAllegato } from "./Allegato";
import type { ICredenziali } from "./Credenziali";

export interface IUser {
  _id: string
  nome: string;
  cognome: string;
  codiceFiscale: string;
  biografia: string;
  fotoProfilo: IAllegato;
  credenziali: ICredenziali;
  createdAt: Date;
  updatedAt: Date;
};