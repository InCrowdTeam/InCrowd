import User from '../models/User';
import Ente from '../models/Ente';
import Operatore from '../models/Operatore';

/**
 * Cerca un account nel sistema tramite email
 * @param email - Email da cercare
 * @returns Oggetto con user, ente, operatore e conteggio totale
 */
export async function findAccountByEmail(email: string) {
  const user = await User.findOne({ 'credenziali.email': email });
  const ente = !user ? await Ente.findOne({ 'credenziali.email': email }) : null;
  const operatore = !user && !ente ? await Operatore.findOne({ 'credenziali.email': email }) : null;
  const results = [user, ente, operatore].filter(Boolean);
  return { user: user || null, ente: ente || null, operatore: operatore || null, count: results.length };
}

/**
 * Verifica se un'email esiste già nel sistema
 * @param email - Email da verificare
 * @returns true se l'email è già registrata
 */
export async function emailExists(email: string): Promise<boolean> {
  const { count } = await findAccountByEmail(email);
  return count > 0;
}

/**
 * Crea una versione sicura di un oggetto con credenziali
 * Rimuove la password e aggiunge il flag hasPassword
 * @param obj - Oggetto da rendere sicuro
 * @returns Oggetto sicuro senza password ma con hasPassword
 */
export function createSafeCredentials(obj: any) {
  if (!obj || !obj.toObject) return obj;
  
  const safeObj = obj.toObject();
  
  // Gestisce le credenziali in modo sicuro
  if (safeObj.credenziali) {
    const hasPassword = !!safeObj.credenziali.password;
    delete safeObj.credenziali.password;
    safeObj.credenziali.hasPassword = hasPassword;
  } else {
    safeObj.credenziali = { email: "", hasPassword: false };
  }
  
  return safeObj;
}
