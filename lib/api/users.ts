import { apiRequest } from './client';
import { buildCrudQuery, CrudQueryParams } from '@/lib/utils/crud-query';
import type { User, UpdateUserDto, ChangePasswordDto } from '@/lib/utils/user';

export interface UsersListResponse {
  data: User[];
  count: number;
  total: number;
  page: number;
  pageCount: number;
}

/**
 * Obtiene la lista de usuarios
 */
export async function getUsersList(params: CrudQueryParams = {}): Promise<UsersListResponse> {
  const queryString = buildCrudQuery(params);
  const endpoint = `/user${queryString ? `?${queryString}` : ''}`;
  return apiRequest<UsersListResponse>(endpoint);
}

/**
 * Obtiene un usuario por ID
 */
export async function getUserById(id: number): Promise<User> {
  return apiRequest<User>(`/user/${id}`);
}

/**
 * Actualiza un usuario
 */
export async function updateUser(id: number, data: UpdateUserDto): Promise<User> {
  return apiRequest<User>(`/user/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Cambia la contraseña de un usuario
 */
export async function changeUserPassword(id: number, data: ChangePasswordDto): Promise<void> {
  return apiRequest<void>(`/user/${id}/update-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export interface RegisterUserDto {
  email: string;
  name: string;
  password: string;
  phoneNumber: string;
  client: number;
}

/**
 * Registra un nuevo usuario
 */
export async function registerUser(data: RegisterUserDto): Promise<User> {
  return apiRequest<User>('/user/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

