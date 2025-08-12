/**
 * PropostaService
 * 
 * Service dedicato alla gestione delle operazioni relative alle proposte.
 * Separazione della logica di business dalle view per migliorare la manutenibilità.
 */

import { getPropostaById, getCommenti, addCommento, toggleHyperProposta } from '@/api/propostaApi';
import type { IProposta } from '@/types/Proposta';

export class PropostaService {
  /**
   * Carica una proposta specifica tramite ID
   * @param propostaId - ID della proposta da caricare
   * @returns Promise<IProposta> - Dati della proposta
   */
  static async loadProposta(propostaId: string): Promise<IProposta> {
    try {
      return await getPropostaById(propostaId);
    } catch (error) {
      console.error('Errore nel caricamento della proposta:', error);
      throw new Error('Impossibile caricare la proposta');
    }
  }

  /**
   * Carica i commenti di una proposta
   * @param propostaId - ID della proposta
   * @returns Promise<any[]> - Lista dei commenti
   */
  static async loadCommenti(propostaId: string): Promise<any[]> {
    try {
      const data = await getCommenti(propostaId);
      return data.commenti || [];
    } catch (error) {
      console.error('Errore nel caricamento commenti:', error);
      throw new Error('Impossibile caricare i commenti');
    }
  }

  /**
   * Invia un nuovo commento
   * @param propostaId - ID della proposta
   * @param contenuto - Contenuto del commento
   * @param token - Token di autenticazione
   * @returns Promise<void>
   */
  static async inviaCommento(propostaId: string, contenuto: string, token: string): Promise<void> {
    if (!contenuto.trim()) {
      throw new Error('Il contenuto del commento non può essere vuoto');
    }

    try {
      await addCommento(propostaId, contenuto.trim(), token);
    } catch (error: any) {
      console.error('Errore nell\'invio del commento:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sessione scaduta. Effettua nuovamente il login.');
      } else if (error.response?.status === 403) {
        throw new Error('Non hai il permesso di commentare.');
      } else {
        throw new Error('Errore nell\'invio del commento');
      }
    }
  }

  /**
   * Gestisce il toggle dell'hyper per una proposta
   * @param propostaId - ID della proposta
   * @param token - Token di autenticazione
   * @returns Promise<IProposta> - Proposta aggiornata
   */
  static async toggleHyper(propostaId: string, token: string): Promise<IProposta> {
    try {
      return await toggleHyperProposta(propostaId, token);
    } catch (error: any) {
      console.error('Errore nel toggle hyper:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sessione scaduta. Effettua nuovamente il login.');
      } else if (error.response?.status === 403) {
        throw new Error('Non hai il permesso di mettere hyper.');
      } else {
        throw new Error('Errore nell\'aggiunta dell\'hyper');
      }
    }
  }

  /**
   * Ottiene l'etichetta della categoria formattata
   * @param categoria - Categoria della proposta
   * @returns string - Etichetta formattata
   */
  static getCategoryLabel(categoria: string): string {
    const categories: Record<string, string> = {
      cultura: '🎭 Cultura',
      concerti: '🎵 Concerti',
      mostreInstallazioni: '🖼️ Mostre e installazioni',
      sport: '⚽ Sport',
      workshopCorsi: '📚 Workshop e corsi',
      conferenze: '🎤 Conferenze'
    };
    return categories[categoria] || categoria;
  }

  /**
   * Processa l'URL dell'immagine per la visualizzazione
   * @param foto - Oggetto foto contenente data e contentType
   * @returns string - URL dell'immagine processata o stringa vuota
   */
  static processImageUrl(foto: any): string {
    if (!foto || !foto.data) return '';
    
    try {
      if (typeof foto.data === 'string') {
        return `data:${foto.contentType || 'image/jpeg'};base64,${foto.data}`;
      }
      
      if (Array.isArray(foto.data)) {
        let binary = '';
        const bytes = new Uint8Array(foto.data);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return `data:${foto.contentType || 'image/jpeg'};base64,${btoa(binary)}`;
      }
    } catch (e) {
      console.error('Errore nella conversione dell\'immagine:', e);
    }
    
    return '';
  }
}
