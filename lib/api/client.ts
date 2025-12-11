const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

/**
 * Cliente API para hacer peticiones al backend
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'accept': '*/*',
    ...(options.headers as Record<string, string> || {}),
  };

  // Agregar token si existe
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rifasuerte_auth');
    if (token) {
      try {
        const authData = JSON.parse(token);
        if (authData?.token) {
          // El backend espera el token en el header 'token' (no Authorization)
          headers['token'] = authData.token;
          // También agregamos Authorization por si acaso
          headers['Authorization'] = `Bearer ${authData.token}`;
        }
      } catch (error) {
        console.error('Error al parsear token:', error);
      }
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
  }

  // Verificar si hay contenido en la respuesta
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');
  
  // Si no hay contenido o el content-length es 0, retornar void
  if (contentLength === '0' || !contentType || !contentType.includes('application/json')) {
    // Intentar leer el body para verificar si está vacío
    const text = await response.text();
    if (!text || text.trim() === '') {
      return undefined as T;
    }
    // Si hay texto pero no es JSON, intentar parsearlo
    try {
      return JSON.parse(text) as T;
    } catch {
      return undefined as T;
    }
  }

  return response.json();
}

