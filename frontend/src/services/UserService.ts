/**
 * UserService
 * 
 * Service dedicato alla gestione delle operazioni relative agli utenti.
 * Include funzioni per avatar, nomi, e gestione compatibilità API.
 */

import { getUserById, getUserAvatar } from '@/api/userApi';
import type { IUser } from '@/types/User';

export class UserService {
  /**
   * Cache per gli avatar degli utenti per evitare richieste multiple
   */
  private static avatarCache = new Map<string, string>();

  /**
   * Carica i dati di un utente tramite ID
   * @param userId - ID dell'utente
   * @returns Promise<IUser | null> - Dati dell'utente o null se non trovato
   */
  static async loadUser(userId: string): Promise<IUser | null> {
    try {
      const userData = await getUserById(userId);
      // Ora tutte le API restituiscono sempre data, ma manteniamo compatibilità
      if (userData && typeof userData === 'object') {
        return userData as IUser;
      }
      return null;
    } catch (error) {
      console.error('Errore nel caricamento dell\'utente:', error);
      return null;
    }
  }

  /**
   * Carica l'avatar di un utente usando il nuovo endpoint dedicato
   * @param userId - ID dell'utente
   * @returns Promise<string> - URL dell'avatar o stringa vuota
   */
  static async loadUserAvatar(userId: string): Promise<string> {
    // Controlla la cache prima
    if (this.avatarCache.has(userId)) {
      const cached = this.avatarCache.get(userId)!;
      return cached === 'NO_AVATAR' ? '' : cached;
    }

    try {
      const avatarUrl = await getUserAvatar(userId);
      
      // Solo se c'è effettivamente un avatar, lo salviamo in cache
      if (avatarUrl && avatarUrl.trim() !== '') {
        this.avatarCache.set(userId, avatarUrl);
        return avatarUrl;
      } else {
        // Per evitare richieste ripetute per utenti senza avatar,
        // salviamo comunque in cache ma con valore speciale
        this.avatarCache.set(userId, 'NO_AVATAR');
        return '';
      }
    } catch (error) {
      console.error('Errore nel caricamento avatar:', error);
      // Salva risultato di errore in cache per evitare richieste ripetute
      this.avatarCache.set(userId, 'NO_AVATAR');
      return '';
    }
  }

  /**
   * Ottiene le iniziali del nome e cognome
   * @param nome - Nome dell'utente
   * @param cognome - Cognome dell'utente
   * @returns string - Iniziali formattate o emoji placeholder
   */
  static getInitials(nome?: string, cognome?: string): string {
    if (!nome && !cognome) return '👤';
    const nomeInit = nome ? nome.charAt(0).toUpperCase() : '';
    const cognomeInit = cognome ? cognome.charAt(0).toUpperCase() : '';
    return nomeInit + cognomeInit || '👤';
  }

  /**
   * Ottiene il nome completo dell'utente
   * @param user - Oggetto utente
   * @returns string - Nome completo formattato
   */
  static getFullName(user?: any): string {
    if (!user) return 'Utente sconosciuto';
    const nome = user.nome || '';
    const cognome = user.cognome || '';
    const fullName = `${nome} ${cognome}`.trim();
    return fullName || 'Utente sconosciuto';
  }

  /**
   * Processa l'avatar dell'utente da oggetto foto
   * @param user - Oggetto utente con fotoProfilo
   * @returns string - URL dell'avatar processato o stringa vuota
   */
  static processUserAvatar(user: any): string {
    if (!user || !user.fotoProfilo?.data) return '';
    
    try {
      if (typeof user.fotoProfilo.data === 'string') {
        return `data:${user.fotoProfilo.contentType || 'image/jpeg'};base64,${user.fotoProfilo.data}`;
      }
      
      if (Array.isArray(user.fotoProfilo.data)) {
        let binary = '';
        const bytes = new Uint8Array(user.fotoProfilo.data);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return `data:${user.fotoProfilo.contentType || 'image/jpeg'};base64,${btoa(binary)}`;
      }
    } catch (e) {
      console.error('Errore nella conversione dell\'avatar:', e);
    }
    
    return '';
  }

  /**
   * Ottiene il nome dell'utente da un oggetto commento
   * @param commento - Oggetto commento con proprietà utente
   * @returns string - Nome dell'utente del commento
   */
  static getCommentUserName(commento: any): string {
    if (!commento.utente) return 'Utente sconosciuto';
    return this.getFullName(commento.utente);
  }

  /**
   * Pulisce la cache degli avatar (utile per logout o refresh)
   */
  static clearAvatarCache(): void {
    this.avatarCache.clear();
  }

  /**
   * Rimuove un avatar specifico dalla cache
   * @param userId - ID dell'utente da rimuovere dalla cache
   */
  static removeFromAvatarCache(userId: string): void {
    this.avatarCache.delete(userId);
  }
}
