enum StatoPropostaEnum {
    IN_APPROVAZIONE = "in_approvazione",
    APPROVATA = "approvata",
    RIFIUTATA = "rifiutata",
}

export interface IStatoProposta {
    stato: StatoPropostaEnum
    commento: string
}