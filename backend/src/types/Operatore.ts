import { Credenziali } from "./Credenziali";

export interface Operatore {
    nome: string;
    cognome: string;
    credenziali: Credenziali;  // Tipo che corrisponde a Credenziali
    createdAt?: Date;
    updatedAt?: Date;
}