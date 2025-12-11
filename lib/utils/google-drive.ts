/**
 * Utilidades para trabajar con Google Drive
 */

const GOOGLE_DRIVE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_DRIVE_CLIENT_ID || '';
const GOOGLE_DRIVE_CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_DRIVE_CLIENT_SECRET || '';
const GOOGLE_DRIVE_REFRESH_TOKEN = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_REFRESH_TOKEN || process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '';

// Cache para el access token
let cachedAccessToken: string | null = null;
let tokenExpiryTime: number = 0;

/**
 * Obtiene un access token usando el refresh token
 */
async function getAccessToken(): Promise<string> {
  // Si tenemos un token válido en cache, usarlo
  if (cachedAccessToken && Date.now() < tokenExpiryTime) {
    return cachedAccessToken;
  }

  try {
    // Verificar que las credenciales estén disponibles
    if (!GOOGLE_DRIVE_CLIENT_ID || !GOOGLE_DRIVE_CLIENT_SECRET || !GOOGLE_DRIVE_REFRESH_TOKEN) {
      throw new Error('Google Drive credentials not configured. Please check your environment variables.');
    }

    // Obtener access token directamente desde Google OAuth2
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_DRIVE_CLIENT_ID,
        client_secret: GOOGLE_DRIVE_CLIENT_SECRET,
        refresh_token: GOOGLE_DRIVE_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error al obtener access token: ${error}`);
    }

    const data = await response.json();
    if (!data.access_token) {
      throw new Error('No se recibió access_token en la respuesta');
    }
    const accessToken = data.access_token as string;
    cachedAccessToken = accessToken;
    // El token expira en 1 hora, pero lo refrescamos 5 minutos antes
    tokenExpiryTime = Date.now() + (data.expires_in - 300) * 1000;

    return accessToken;
  } catch (error) {
    throw error;
  }
}

/**
 * Descarga un archivo de Google Drive usando su ID
 * @param fileId ID del archivo en Google Drive
 * @returns Blob con el contenido del archivo
 */
export async function downloadGoogleDriveFile(fileId: string): Promise<Blob> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error al descargar archivo: ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let mimeType = response.headers.get('content-type') || '';
    
    // Detectar tipo de archivo por magic numbers
    if (!mimeType || mimeType === 'application/octet-stream') {
      const textDecoder = new TextDecoder();
      const firstBytes = textDecoder.decode(uint8Array.slice(0, Math.min(100, uint8Array.length)));
      
      if (firstBytes.trim().startsWith('<?xml') || firstBytes.trim().startsWith('<svg') || firstBytes.trim().startsWith('<!DOCTYPE svg')) {
        mimeType = 'image/svg+xml';
      } else if (uint8Array.length >= 3 && uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
        mimeType = 'image/jpeg';
      } else if (uint8Array.length >= 8 && 
                 uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
        mimeType = 'image/png';
      } else if (uint8Array.length >= 4 && 
                 uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46) {
        mimeType = 'image/gif';
      } else if (firstBytes.includes('ftyp') || firstBytes.includes('mp4')) {
        mimeType = 'video/mp4';
      } else {
        if (arrayBuffer.byteLength < 10000) {
          mimeType = 'image/svg+xml';
        } else {
          mimeType = 'image/jpeg';
        }
      }
    }
    
    const blob = new Blob([arrayBuffer], { type: mimeType });
    
    return blob;
  } catch (error) {
    throw error;
  }
}

/**
 * Descarga un archivo de Google Drive y lo convierte a base64
 * @param fileId ID del archivo en Google Drive
 * @returns Base64 data URL para mostrar la imagen/video
 */
export async function downloadGoogleDriveFileAsBase64(fileId: string): Promise<string> {
  const blob = await downloadGoogleDriveFile(fileId);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Convierte un archivo a base64
 * @param file Archivo a convertir
 * @returns Base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
}

