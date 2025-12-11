/**
 * Tipos para Rifas
 */

export interface Prize {
  name: string;
  image?: string; // base64 o ID de Google Drive
}

export interface PaymentData {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  method: string;
  identification?: string;
  accountNumber?: string;
  phoneNumber?: string;
  bank?: string;
  accountType?: string;
  name?: string;
  raffle?: number;
  logoBase64?: string; // Logo en base64 del método de pago (frontend)
  logo?: string; // Logo del backend (se mapea a logoBase64)
  visible?: boolean; // Si el método de pago es visible o no
}

export interface WinningTicket {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  ticketNumber: number;
}

export interface Raffle {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  name: string;
  extra: string;
  isActive: boolean;
  selectNumber: boolean;
  winningBySystem: boolean;
  roulette: boolean;
  ticketLimit: number;
  minTickets: number;
  date: string;
  ticketPrice: string;
  ticketCurrency: string;
  numberOfWinners: number;
  prizes: string[]; // Array de strings en formato "nombre@base64" o "nombre@driveId"
  innerCode?: string; // Código interno de la rifa
  client: {
    id: number;
    name: string;
    domain?: string;
  };
  paymentData?: PaymentData[];
  tickets?: any[];
  ticketsCount?: number; // Contador de tickets (cuando se usa el endpoint optimizado)
  winningTickets?: WinningTicket[];
}

export interface CreateRaffleDto {
  name: string;
  extra: string;
  selectNumber: boolean;
  winningBySystem: boolean;
  roulette: boolean;
  ticketLimit: number;
  minTickets: number;
  date: string;
  ticketPrice: string;
  ticketCurrency: string;
  numberOfWinners: number;
  prizes: string[]; // Array de strings en formato "nombre@base64"
  client: number;
}

export interface CreatePaymentDataDto {
  method: string;
  identification?: string;
  accountNumber?: string;
  phoneNumber?: string;
  bank?: string;
  accountType?: string;
  name?: string;
  raffle: number;
  logo?: string; // Logo en base64 (se envía como "logo" al servidor)
  visible?: boolean; // Si el método de pago es visible o no
}

/**
 * Convierte un array de premios a formato string para el backend
 * - Si es base64 (nueva imagen): "nombre@base64"
 * - Si es ID de Google Drive y solo cambió el nombre: "nombre@driveId" (mantener el ID)
 * - Si no hay imagen: "nombre"
 */
export function prizesToString(prizes: Prize[], isEditMode: boolean = false, originalPrizes?: Prize[]): string[] {
  return prizes.map((prize, index) => {
    // Si hay imagen
    if (prize.image) {
      // Si es base64 (nueva imagen), incluirla
      if (prize.image.startsWith('data:')) {
        return `${prize.name}@${prize.image}`;
      }
      // Si es un ID de Google Drive (no empieza con data:)
      // En modo edición, si la imagen original era la misma (mismo ID), mantener el ID
      if (isEditMode && originalPrizes && originalPrizes[index]?.image === prize.image) {
        // Solo cambió el nombre, mantener el ID de Google Drive
        return `${prize.name}@${prize.image}`;
      }
      // Si es un ID de Google Drive nuevo (no debería pasar normalmente)
      return `${prize.name}@${prize.image}`;
    }
    return prize.name;
  });
}

/**
 * Parsea un string de premio del backend a objeto Prize
 */
export function parsePrizeString(prizeString: string): Prize {
  const parts = prizeString.split('@');
  if (parts.length === 2) {
    return {
      name: parts[0],
      image: parts[1],
    };
  }
  return {
    name: prizeString,
  };
}

