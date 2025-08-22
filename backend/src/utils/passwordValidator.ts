export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'good' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // Controlli di sicurezza parametrizzati tramite variabile di ambiente
  const securityEnabled = process.env.ENABLE_SECURITY_CONTROLS !== 'false';
  
  // Controlli di base sempre attivi
  if (!password) {
    errors.push('La password è obbligatoria');
    return { isValid: false, errors, strength: 'weak' };
  }
  
  if (!securityEnabled) {
    // Se i controlli sono disabilitati, accetta qualsiasi password non vuota
    return {
      isValid: true,
      errors: [],
      strength: 'weak'
    };
  }
  
  // Controlli di sicurezza (abilitabili/disabilitabili)
  // Requisiti minimi: 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero, 1 carattere speciale
  if (password.length < 8) {
    errors.push('La password deve contenere almeno 8 caratteri');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera minuscola');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera maiuscola');
  }
  
  if (!/[0-9]/.test(password)) {
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
    numbers: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  if (score >= 5 && password.length >= 12) {
    strength = 'strong';
  } else if (score >= 5) {
    strength = 'good';
  } else if (score >= 4) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
