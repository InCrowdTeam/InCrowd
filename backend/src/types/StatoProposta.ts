enum StatoPropostaEnum {
    IN_APPROVAZIONE = "in_approvazione",
    APPROVATA = "approvata",
    RIFIUTATA = "rifiutata",
}

export interface StatoProposta {
    stato: StatoPropostaEnum
    commento: string
}