/**
 * Tipos para Payments y Tickets
 */

export interface User {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  name: string;
  email: string;
  phoneNumber: string;
  identification?: string;
}

export interface Ticket {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  ticketNumber: number;
}

export interface Payment {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  voucher: string; // Google Drive ID o base64
  method: string;
  isValidated: string; // "Pendiente", "Validado", "Rechazado", etc.
  user: User; // Usuario directamente en Payment
  raffle: {
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
    ticketPrice: string;
    ticketCurrency: string;
    date: string;
    numberOfWinners: number;
    prizes: string[];
  };
  client: {
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
  };
  tickets: Ticket[];
}

