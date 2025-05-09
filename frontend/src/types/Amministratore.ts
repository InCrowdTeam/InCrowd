import type { ICredenziali } from "./Credenziali";

export interface IAmministratore {
    credenziali: ICredenziali;  // Tipo che corrisponde a Credenziali
    createdAt?: Date;
    updatedAt?: Date;
}