import { apiRequest } from './client';

/**
 * Estadísticas de rifas por cliente
 */
export interface RaffleStats {
  id: number;
  name: string;
  isActive: boolean;
  ticketsSold: number;
  revenue: number;
  ticketLimit: number;
  ticketCurrency?: string; // Moneda del ticket
  innerCode?: string; // Código interno de la rifa
  createdAt: string;
  updatedAt: string;
}

/**
 * Estadísticas de un cliente
 */
export interface ClientStats {
  id: number;
  name: string;
  fantasyName: string;
  domain: string;
  totalRaffles: number;
  activeRaffles: number;
  closedRaffles: number;
  raffles: RaffleStats[];
}

/**
 * Estadísticas generales para superadmin
 */
export interface SuperadminStats {
  totalClients: number;
  clients: ClientStats[];
}

/**
 * Obtiene las estadísticas para superadmin
 * El backend distingue entre admin y superadmin por el token
 * @param clientId - ID del cliente (opcional, solo si superadmin tiene cliente seleccionado)
 */
export async function getSuperadminStats(clientId?: number): Promise<SuperadminStats> {
  const queryParams = new URLSearchParams();
  if (clientId) {
    queryParams.append('clientId', clientId.toString());
  }
  const queryString = queryParams.toString();
  
  return apiRequest<SuperadminStats>(`/admin/dashboard${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });
}

/**
 * Estadísticas de rifa para admin/client (con más detalles)
 */
export interface AdminRaffleStats {
  id: number;
  name: string;
  isActive: boolean;
  ticketsSold: number;
  revenue: number;
  ticketLimit: number;
  ticketPrice: string;
  ticketCurrency: string;
  date: string;
  numberOfWinners: number;
  prizes: string[];
  innerCode?: string; // Código interno de la rifa
  createdAt: string;
  updatedAt: string;
}

/**
 * Estadísticas para admin/client
 */
export interface AdminStats {
  client: {
    id: number;
    name: string;
    fantasyName: string;
    domain: string;
  };
  totalRaffles: number;
  activeRaffles: number;
  closedRaffles: number;
  raffles: AdminRaffleStats[];
}

/**
 * Obtiene las estadísticas para admin/client
 * @param clientId - ID del cliente del admin/client
 */
export async function getAdminStats(clientId: number): Promise<AdminStats> {
  const queryParams = new URLSearchParams();
  queryParams.append('clientId', clientId.toString());
  
  return apiRequest<AdminStats>(`/admin/dashboard?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });
}

