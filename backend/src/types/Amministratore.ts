import { Credenziali } from "./Credenziali";

export interface Amministratore {
    credenziali: Credenziali;  // Tipo che corrisponde a Credenziali
    createdAt?: Date;
    updatedAt?: Date;
}