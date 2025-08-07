import type { LoginCredentials, GoogleLoginData, SignupData } from '@/types/User';

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/auth`;

export interface LoginResponse {
  token: string;
  user?: any;
  userType: string;
}

export interface GoogleLoginResponse extends LoginResponse {
  needsRegistration?: boolean;
  data?: any;
}

// Login tradizionale
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel login');
  }

  return res.json();
}

// Login con Google
export async function googleLogin(data: GoogleLoginData): Promise<GoogleLoginResponse> {
  const res = await fetch(`${BASE_URL}/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  // Gestione speciale per la registrazione necessaria
  if (res.status === 404) {
    const response = await res.json();
    if (response.needsRegistration) {
      return response; // Non è un errore, ma una registrazione necessaria
    }
  }

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel login con Google');
  }

  return res.json();
}

// Completamento registrazione Google
export async function completeGoogleSignup(formData: FormData, isEnte: boolean = false): Promise<any> {
  const url = isEnte 
    ? `${import.meta.env.VITE_BACKEND_URL}/api/enti`
    : `${import.meta.env.VITE_BACKEND_URL}/api/users`;

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nella registrazione');
  }

  return res.json();
}

// Collega account Google
export async function linkGoogleAccount(idToken: string, authToken: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/link-google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Errore nel collegamento dell\'account Google');
  }

  return res.json();
}

