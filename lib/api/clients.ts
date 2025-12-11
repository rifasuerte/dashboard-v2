import { apiRequest } from './client';
import type { CrudQueryParams } from '@/lib/utils/crud-query';
import { buildCrudQuery } from '@/lib/utils/crud-query';
import type { Client } from '@/lib/utils/auth';

/**
 * Respuesta de lista de clientes
 */
export interface ClientsListResponse {
  data: Client[];
  count: number;
  total: number;
  page: number;
  pageCount: number;
}

/**
 * Obtiene la lista de clientes con filtros, ordenamiento y búsqueda
 */
export async function getClientsList(params: CrudQueryParams = {}): Promise<ClientsListResponse> {
  const queryString = buildCrudQuery(params);
  const url = `/client${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<ClientsListResponse>(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });
}

