import type { IAllegato } from "./Allegato";
import type { ICredenziali } from "./Credenziali";

export interface IUser {
  _id: string
  tipo: "privato" | "ente";
  nome: string;
  cognome?: string;        // solo per "privato"
  codiceFiscale?: string;  // solo per "ente"
  biografia: string;
  fotoProfilo: IAllegato;
  credenziali: ICredenziali;
  createdAt: Date;
  updatedAt: Date;
};