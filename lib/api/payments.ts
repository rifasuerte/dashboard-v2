import { apiRequest } from './client';
import type { CrudQueryParams } from '@/lib/utils/crud-query';
import { buildCrudQuery } from '@/lib/utils/crud-query';
import type { Payment } from '@/lib/utils/payment';

/**
 * Respuesta de lista de payments
 */
export interface PaymentsListResponse {
  data: Payment[];
  count: number;
  total: number;
  page: number;
  pageCount: number;
}

/**
 * Obtiene la lista de payments con filtros, ordenamiento y búsqueda
 */
export async function getPaymentsList(params: CrudQueryParams = {}): Promise<PaymentsListResponse> {
  const queryString = buildCrudQuery(params);
  const url = `/payment${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<PaymentsListResponse>(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });
}

/**
 * Valida un pago
 */
export async function validatePayment(id: number): Promise<Payment> {
  return apiRequest<Payment>(`/payment/${id}/validate`, {
    method: 'PATCH',
    headers: {
      'accept': 'application/json',
    },
  });
}

/**
 * Rechaza un pago
 */
export async function rejectPayment(id: number): Promise<Payment> {
  return apiRequest<Payment>(`/payment/${id}/reject`, {
    method: 'PATCH',
    headers: {
      'accept': 'application/json',
    },
  });
}

export interface CreatePaymentDto {
  voucher: string;
  method: string;
  raffle: number;
  user: number;
}

/**
 * Crea un nuevo pago
 */
export async function createPayment(data: CreatePaymentDto): Promise<Payment> {
  return apiRequest<Payment>('/payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}
