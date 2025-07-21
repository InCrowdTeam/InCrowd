import User from '../models/User';
import Ente from '../models/Ente';
import Operatore from '../models/Operatore';

export async function findAccountByEmail(email: string) {
  const user = await User.findOne({ 'credenziali.email': email });
  const ente = !user ? await Ente.findOne({ 'credenziali.email': email }) : null;
  const operatore = !user && !ente ? await Operatore.findOne({ 'credenziali.email': email }) : null;
  const results = [user, ente, operatore].filter(Boolean);
  return { user: user || null, ente: ente || null, operatore: operatore || null, count: results.length };
}

export async function emailExists(email: string): Promise<boolean> {
  const { count } = await findAccountByEmail(email);
  return count > 0;
}
