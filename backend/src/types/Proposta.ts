import { IAllegato } from "./Allegato";
import { IIndirizzo } from "./Indirizzo";
import { IStatoProposta } from "./StatoProposta";

export interface IProposta {
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