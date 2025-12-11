import { apiRequest } from './client';

export interface CreateTicketDto {
  userId: number;
  numberOfTicketsToBuy: number;
  raffleId: number;
  paymentId: number;
  isCash: boolean;
}

export interface Ticket {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  ticketNumber: number;
}

/**
 * Crea tickets para un usuario
 */
export async function createTicket(data: CreateTicketDto): Promise<Ticket> {
  return apiRequest<Ticket>('/ticket', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Respuesta de top usuarios
 */
export interface TopUser {
  user: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  ticketCount: number;
}

/**
 * Obtiene los top 3 usuarios que más han comprado tickets en una rifa en un rango de fechas
 */
export async function getTopUsers(
  raffleId: number,
  startDate: string,
  endDate: string
): Promise<TopUser[]> {
  const queryParams = new URLSearchParams({
    startDate,
    endDate,
  });
  
  return apiRequest<TopUser[]>(`/ticket/top-users/${raffleId}?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });
}
