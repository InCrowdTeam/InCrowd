/**
 * DateService
 * 
 * Service dedicato alla formattazione e gestione delle date.
 * Fornisce funzioni per date relative e formattazione localizzata.
 */

export class DateService {
  /**
   * Formatta una data in modo relativo (es: "2 giorni fa", "Ieri", ecc.)
   * @param dateString - Stringa data da formattare
   * @returns string - Data formattata in modo relativo
   */
  static formatRelativeDate(dateString: string): string {
    if (!dateString) return 'Data non disponibile';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Verifica che la data sia valida
      if (isNaN(date.getTime())) {
        return 'Data non valida';
      }
      
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // Gestisce il futuro vs passato
      const isPast = date.getTime() < now.getTime();
      const suffix = isPast ? 'fa' : 'da ora';
      
      if (diffMinutes < 1) {
        return 'Proprio ora';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minuti ${suffix}`;
      } else if (diffHours < 24) {
        return `${diffHours} ore ${suffix}`;
      } else if (diffDays === 1) {
        return isPast ? 'Ieri' : 'Domani';
      } else if (diffDays <= 7) {
        return `${diffDays} giorni ${suffix}`;
      } else {
        return this.formatDate(dateString);
      }
    } catch (error) {
      console.error('Errore nella formattazione della data relativa:', error);
      return 'Data non disponibile';
    }
  }

  /**
   * Formatta una data in formato italiano standard
   * @param dateString - Stringa data da formattare
   * @returns string - Data formattata (es: "15 gen 2024")
   */
  static formatDate(dateString: string): string {
    if (!dateString) return 'Data non disponibile';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      if (isNaN(date.getTime())) {
        return 'Data non valida';
      }
      
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      console.error('Errore nella formattazione della data:', error);
      return 'Data non disponibile';
    }
  }

  /**
   * Formatta una data con ora completa
   * @param dateString - Stringa data da formattare
   * @returns string - Data e ora formattate (es: "15 gennaio 2024 alle 14:30")
   */
  static formatDateTime(dateString: string): string {
    if (!dateString) return 'Data non disponibile';
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Data non valida';
      }
      
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Errore nella formattazione della data completa:', error);
      return 'Data non disponibile';
    }
  }

  /**
   * Formatta una data in formato compatto per meta informazioni
   * @param dateString - Stringa data da formattare
   * @returns string - Data formattata in modo compatto
   */
  static formatCompactDate(dateString: string): string {
    if (!dateString) return 'Data da definire';
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Data non valida';
      }
      
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Errore nella formattazione della data compatta:', error);
      return 'Data non disponibile';
    }
  }

  /**
   * Formatta una data per eventi in formato esteso italiano
   * @param dateString - Stringa data da formattare
   * @returns string - Data formattata per evento (es: "Sabato 15 gennaio 2024")
   */
  static formatEventDate(dateString: string): string {
    if (!dateString) return 'Data da definire';
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Data non valida';
      }
      
      return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Errore nella formattazione della data evento:', error);
      return 'Data non disponibile';
    }
  }

  /**
   * Calcola se una data è nel passato
   * @param dateString - Stringa data da verificare
   * @returns boolean - True se la data è nel passato
   */
  static isPastDate(dateString: string): boolean {
    if (!dateString) return false;
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      if (isNaN(date.getTime())) {
        return false;
      }
      
      return date.getTime() < now.getTime();
    } catch (error) {
      console.error('Errore nella verifica della data passata:', error);
      return false;
    }
  }

  /**
   * Calcola la differenza in giorni tra due date
   * @param date1 - Prima data
   * @param date2 - Seconda data
   * @returns number - Differenza in giorni
   */
  static getDaysDifference(date1: string, date2: string): number {
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        return 0;
      }
      
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Errore nel calcolo della differenza di giorni:', error);
      return 0;
    }
  }
}
