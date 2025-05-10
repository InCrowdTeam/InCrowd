import { IAllegato } from "./Allegato";
import { ICredenziali } from "./Credenziali";

export interface IUser {
  nome: string;
  codiceFiscale: string;  
  biografia: string;
  fotoProfilo: IAllegato;
  credenziali: ICredenziali;
  createdAt: Date;
  updatedAt: Date;
};