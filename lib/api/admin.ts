import { apiRequest } from './client';
import type { AuthResponse } from '@/lib/utils/auth';
import type { CrudQueryParams } from '@/lib/utils/crud-query';
import { buildCrudQuery } from '@/lib/utils/crud-query';

/**
 * Respuesta de lista de administradores
 */
export interface AdminsListResponse {
  data: AuthResponse[];
  count: number;
  total: number;
  page: number;
  pageCount: number;
}

/**
 * DTO para crear admin
 */
export interface CreateAdminDto {
  name: string;
  email: string;
  password: string;
  role: string;
  identification?: string;
  client?: number;
}

/**
 * DTO para actualizar admin
 */
export interface UpdateAdminDto {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  identification?: string;
  client?: number;
}

/**
 * DTO para cambiar contraseña
 */
export interface ChangePasswordDto {
  newPassword: string;
}

/**
 * Obtiene un admin por ID
 */
export async function getAdminById(id: number): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(`/admin/${id}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });
}

/**
 * Obtiene la lista de administradores con filtros, ordenamiento y búsqueda
 */
export async function getAdminsList(params: CrudQueryParams = {}): Promise<AdminsListResponse> {
  const queryString = buildCrudQuery(params);
  const url = `/admin${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<AdminsListResponse>(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });
}

/**
 * Crea un nuevo administrador
 */
export async function createAdmin(data: CreateAdminDto): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/admin', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Actualiza un administrador
 */
export async function updateAdmin(id: number, data: UpdateAdminDto): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(`/admin/${id}`, {
    method: 'PATCH',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Cambia la contraseña de un administrador
 */
export async function changeAdminPassword(id: number, data: ChangePasswordDto): Promise<void> {
  return apiRequest<void>(`/admin/${id}/change-password`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}
