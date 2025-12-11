// Tipos para el cliente
export interface Client {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  name: string;
  whatsapp: string;
  fantasyName: string;
  domain: string;
  logoURL: string;
  bannerURL: string;
  banner2URL: string;
  bannerAuthURL: string;
  videoURL: string;
  autoadminitrable: boolean;
  getDataFromGoogle: boolean;
  requiresAuth: boolean;
  instagram?: string; // Instagram en formato @Username
}

// Tipos para la respuesta de autenticación
export interface AuthResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  email: string;
  name: string;
  role: string;
  identification: string;
  client: null | Client;
  token: string;
}

// Clave para localStorage
const AUTH_KEY = 'rifasuerte_auth';

/**
 * Guarda las credenciales en localStorage
 */
export function saveAuth(authData: AuthResponse): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
  }
}

/**
 * Actualiza las credenciales en localStorage manteniendo el token
 */
export function updateAuth(updates: Partial<AuthResponse>): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const currentAuth = getAuth();
  if (!currentAuth) {
    return;
  }
  
  const updatedAuth: AuthResponse = {
    ...currentAuth,
    ...updates,
    // Mantener el token original
    token: currentAuth.token,
  };
  
  saveAuth(updatedAuth);
}

/**
 * Obtiene las credenciales del localStorage
 */
export function getAuth(): AuthResponse | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const authData = localStorage.getItem(AUTH_KEY);
    if (!authData) {
      return null;
    }
    return JSON.parse(authData) as AuthResponse;
  } catch (error) {
    console.error('Error al leer credenciales:', error);
    return null;
  }
}

/**
 * Elimina las credenciales del localStorage
 */
export function clearAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
  }
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  const auth = getAuth();
  return auth !== null && auth.token !== undefined;
}

/**
 * Obtiene el token de autenticación
 */
export function getToken(): string | null {
  const auth = getAuth();
  return auth?.token || null;
}

