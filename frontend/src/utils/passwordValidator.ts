export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'good' | 'strong';
  score: number;
  percentage: number;
}

export interface PasswordChecks {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

/**
 * Valida una password usando le stesse regole del backend
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // Controlli di sicurezza
  if (!password) {
    errors.push('La password è obbligatoria');
    return { isValid: false, errors, strength: 'weak', score: 0, percentage: 0 };
  }
  
  if (password.length < 8) {
    errors.push('La password deve contenere almeno 8 caratteri');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera minuscola');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera maiuscola');
  }
  
  if (!/\d/.test(password)) {
    errors.push('La password deve contenere almeno un numero');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('La password deve contenere almeno un carattere speciale (!@#$%^&*)');
  }
  
  // Controlli aggiuntivi per sicurezza
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('La password scelta è troppo comune e facilmente indovinabile');
  }
  
  // Controllo per pattern ripetitivi (4 o più caratteri uguali consecutivi)
  if (/(.)\1{3,}/.test(password)) {
    errors.push('La password non deve contenere più di 3 caratteri identici consecutivi');
  }
  
  // Controllo per sequenze troppo semplici (solo se sono la maggior parte della password)
  if (password.length <= 8 && (/123456|abcdef|qwerty/i.test(password))) {
    errors.push('La password non deve essere basata su sequenze troppo semplici');
  }
  
  // Calcolo della forza
  let strength: 'weak' | 'medium' | 'good' | 'strong' = 'weak';
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  const percentage = (score / 5) * 100;
  
  if (score >= 5 && password.length >= 12) {
    strength = 'strong';
  } else if (score >= 4) {
    strength = 'good';
  } else if (score >= 3) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
    percentage
  };
}

/**
 * Ottiene i controlli specifici per una password
 */
export function getPasswordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
}

/**
 * Ottiene il testo descrittivo per la forza della password
 */
export function getPasswordStrengthText(strength: 'weak' | 'medium' | 'good' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'Password debole';
    case 'medium':
      return 'Password media';
    case 'good':
      return 'Password buona';
    case 'strong':
      return 'Password sicura';
    default:
      return 'Password debole';
  }
}

/**
 * Ottiene la classe CSS per la forza della password
 */
export function getPasswordStrengthClass(strength: 'weak' | 'medium' | 'good' | 'strong'): string {
  return strength;
}

/**
 * Verifica se i controlli di sicurezza sono abilitati tramite variabile d'ambiente
 */
export function areSecurityControlsEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_SECURITY_CONTROLS === 'true';
}

/**
 * Validazione semplificata per sviluppo (quando i controlli di sicurezza sono disabilitati)
 */
export function validatePasswordSimple(password: string): boolean {
  return !!(password && password.length >= 6);
}
