import { Allegato } from "./Allegato";
import { Credenziali } from "./Credenziali";

export interface User {
  tipo: "privato" | "ente";
  nome: string;
  cognome?: string;        // solo per "privato"
  codiceFiscale?: string;  // solo per "ente"
  biografia: string;
  fotoProfilo: Allegato;
  credenziali: Credenziali;
  createdAt: Date;
  updatedAt: Date;
};