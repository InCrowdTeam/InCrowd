import { Allegato } from "./Allegato";
import { Indirizzo } from "./Indirizzo";
import { StatoProposta } from "./StatoProposta";

export interface Proposta {
    titolo: string;
    stato: StatoProposta;
    proponenteID: string;
    descrizione: string;
    foto?: Allegato;
    categoria?: string;
    luogo?: Indirizzo;
    dataIpotetica?: Date;
    listaHyper: [string];
    createdAt: Date;
    updatedAt: Date;
  };