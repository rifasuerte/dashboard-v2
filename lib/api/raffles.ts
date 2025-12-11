import { apiRequest } from './client';
import type { CrudQueryParams } from '@/lib/utils/crud-query';
import { buildCrudQuery } from '@/lib/utils/crud-query';
import type { Raffle, CreateRaffleDto, CreatePaymentDataDto, PaymentData } from '@/lib/utils/raffle';

/**
 * Respuesta de lista de rifas
 */
export interface RafflesListResponse {
  data: Raffle[];
  count: number;
  total: number;
  page: number;
  pageCount: number;
}

/**
 * Obtiene la lista de rifas con filtros, ordenamiento y búsqueda
 */
export async function getRafflesList(params: CrudQueryParams = {}): Promise<RafflesListResponse> {
  const queryString = buildCrudQuery(params);
  const url = `/raffle${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<RafflesListResponse>(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });
}

/**
 * Obtiene una rifa por ID
 */
export async function getRaffleById(id: number): Promise<Raffle> {
  return apiRequest<Raffle>(`/raffle/${id}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });
}

/**
 * Obtiene las rifas activas de un cliente (sin cargar todos los tickets)
 */
export async function getActiveRafflesByClient(clientId: number): Promise<Raffle[]> {
  return apiRequest<Raffle[]>(`/raffle/active/client/${clientId}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });
}

/**
 * Crea una nueva rifa
 */
export async function createRaffle(data: CreateRaffleDto): Promise<Raffle> {
  return apiRequest<Raffle>('/raffle', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Actualiza una rifa
 */
export async function updateRaffle(id: number, data: Partial<CreateRaffleDto>): Promise<Raffle> {
  return apiRequest<Raffle>(`/raffle/${id}`, {
    method: 'PATCH',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Crea datos de pago
 */
export async function createPaymentData(data: CreatePaymentDataDto): Promise<PaymentData> {
  return apiRequest<PaymentData>('/payment-data', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Actualiza datos de pago
 */
export async function updatePaymentData(id: number, data: Partial<CreatePaymentDataDto>): Promise<PaymentData> {
  return apiRequest<PaymentData>(`/payment-data/${id}`, {
    method: 'PATCH',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Elimina datos de pago
 */
export async function deletePaymentData(id: number): Promise<void> {
  return apiRequest<void>(`/payment-data/${id}`, {
    method: 'DELETE',
    headers: {
      'accept': 'application/json',
    },
  });
}

/**
 * Cierra una rifa (realiza el sorteo)
 */
export interface DrawRaffleDto {
  winningNumbers?: string[];
}

export async function drawRaffle(id: number, data: DrawRaffleDto): Promise<void> {
  return apiRequest<void>(`/raffle/${id}/draw`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Interfaz para un ticket comprado
 */
export interface PurchasedTicket {
  number: number;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  isPaid: boolean;
}

/**
 * Obtiene los números de tickets comprados de una rifa
 */
export async function getPurchasedTickets(raffleId: number): Promise<PurchasedTicket[]> {
  return apiRequest<PurchasedTicket[]>(`/raffle/${raffleId}/purchased-tickets`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });
}

/**
 * Obtiene los ingresos por método de pago de una rifa
 */
export interface RevenueByMethod {
  method: string;
  ticketsCount: number;
  revenue: number;
  currency: string;
  logo: string | null;
  visible: boolean;
}

export async function getRevenueByMethod(raffleId: number): Promise<RevenueByMethod[]> {
  return apiRequest<RevenueByMethod[]>(`/raffle/${raffleId}/revenue-by-method`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });
}

