/**
 * Tipos para Users
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
  tickets?: Ticket[];
  client?: {
    id: number;
    name: string;
    fantasyName: string;
    domain: string;
  };
}

export interface Ticket {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  ticketNumber: number;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phoneNumber?: string;
}

export interface ChangePasswordDto {
  newPassword: string;
}

