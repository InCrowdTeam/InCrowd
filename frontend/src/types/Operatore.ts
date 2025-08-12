import type { ICredenziali } from "./Credenziali";

export interface IOperatore {
    nome: string;
    cognome: string;
    credenziali: ICredenziali;  // Tipo che corrisponde a Credenziali
    createdAt?: Date;
    updatedAt?: Date;
}