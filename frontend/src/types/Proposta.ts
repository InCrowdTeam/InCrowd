import type { IAllegato } from "./Allegato";
import type { IIndirizzo } from "./Indirizzo";
import type { IStatoProposta } from "./StatoProposta";

export interface IProposta {
    _id: string;
    titolo: string;
    stato: IStatoProposta;
    proponenteID: string;
    descrizione: string;
    foto?: IAllegato;
    categoria?: string;
    luogo?: IIndirizzo;
    dataIpotetica?: Date;
    listaHyper: [string];
    createdAt: Date;
    updatedAt: Date;
  };