// Convertito da `enum` a const-object + union type per compatibilità con
// `erasableSyntaxOnly` (l'enum non è "erasable"). Valori identici all'originale.
export const StatoPropostaEnum = {
  IN_APPROVAZIONE: 'in_approvazione',
  APPROVATA: 'approvata',
  RIFIUTATA: 'rifiutata',
} as const

export type StatoPropostaEnum = (typeof StatoPropostaEnum)[keyof typeof StatoPropostaEnum]

export interface IStatoProposta {
    stato: StatoPropostaEnum
    commento: string
}
