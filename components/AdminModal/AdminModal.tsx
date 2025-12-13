'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api/client';
import { useLoading } from '@/contexts/LoadingContext';
import { useAlert } from '@/contexts/AlertContext';
import { getRoleLabel } from '@/lib/utils/roles';
import { getAuth } from '@/lib/utils/auth';
import ClientSelect from '@/components/ClientSelect/ClientSelect';
import type { AuthResponse } from '@/lib/utils/auth';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  admin: AuthResponse | null; // null para crear, objeto para editar
}

interface CreateAdminDto {
  name: string;
  email: string;
  password?: string;
  role: string;
  identification?: string;
  client?: number;
}

export default function AdminModal({ isOpen, onClose, onSuccess, admin }: AdminModalProps) {
  const { showLoading, hideLoading } = useLoading();
  const { showAlert } = useAlert();
  const auth = getAuth();
  const isSuperadmin = auth?.role === 'superadmin';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [identification, setIdentification] = useState('');
  const [clientId, setClientId] = useState<number | undefined>(undefined);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const isEditMode = !!admin;

  // Cargar datos del admin si es modo edición
  useEffect(() => {
    if (isOpen && admin) {
      setName(admin.name || '');
      setEmail(admin.email || '');
      setRole(admin.role || 'admin');
      setIdentification(admin.identification || '');
      if (isSuperadmin) {
        setClientId(admin.client?.id);
      } else {
        // Si no es superadmin, usar el cliente del admin logueado
        setClientId(auth?.client?.id);
      }
      setPassword(''); // No cargar contraseña
    } else if (isOpen && !admin) {
      // Resetear formulario para crear
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('admin');
      setIdentification('');
      if (isSuperadmin) {
        setClientId(undefined);
      } else {
        // Si no es superadmin, usar el cliente del admin logueado
        setClientId(auth?.client?.id);
      }
    }
  }, [isOpen, admin, isSuperadmin, auth?.client?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!name || !email || !role) {
      showAlert('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    if (!isEditMode && !password) {
      showAlert('La contraseña es requerida para crear un nuevo administrador', 'warning');
      return;
    }

    // Validar requisitos de contraseña
    if (!isEditMode && password) {
      const errors: string[] = [];
      if (password.length < 8) {
        errors.push('Mínimo 8 caracteres');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Al menos una mayúscula');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Al menos una minúscula');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('Al menos un número');
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Al menos un carácter especial');
      }
      
      if (errors.length > 0) {
        showAlert(`La contraseña debe cumplir: ${errors.join(', ')}`, 'warning');
        return;
      }
    }

    if (!isEditMode && password !== confirmPassword) {
      showAlert('Las contraseñas no coinciden', 'warning');
      return;
    }

    // Si no es superadmin, usar el cliente del admin logueado
    const finalClientId = isSuperadmin ? clientId : auth?.client?.id;
    
    // Validar cliente para rol admin o client (validador) (solo si es superadmin)
    if (isSuperadmin && (role === 'admin' || role === 'client') && !clientId) {
      showAlert(`Debes seleccionar un cliente para el rol ${role === 'admin' ? 'admin' : 'validador'}`, 'warning');
      return;
    }
    
    if (!isSuperadmin && (role === 'admin' || role === 'client') && !finalClientId) {
      showAlert('No se pudo determinar el cliente asociado', 'error');
      return;
    }

    showLoading(isEditMode ? 'Actualizando administrador...' : 'Creando administrador...');

    try {
      const data: CreateAdminDto = {
        name,
        email,
        role,
        identification: identification || undefined,
        client: finalClientId,
      };

      if (!isEditMode) {
        data.password = password;
      } else if (password) {
        // Si hay contraseña en modo edición, también actualizarla
        data.password = password;
      }

      if (isEditMode && admin) {
        // Actualizar (sin contraseña, eso se hace en el modal de cambiar contraseña)
        await apiRequest<AuthResponse>(`/admin/${admin.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        // Crear (con contraseña requerida)
        await apiRequest<AuthResponse>('/admin', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }

      hideLoading();
      onSuccess();
      onClose();
    } catch (err) {
      hideLoading();
      showAlert(err instanceof Error ? err.message : 'Error al guardar el administrador', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'Editar Administrador' : 'Crear Administrador'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {!isEditMode && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contraseña *
                    <div className="group relative inline-block ml-2">
                      <svg
                        className="w-4 h-4 text-gray-400 cursor-help"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64">
                        <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
                          <div className="font-semibold mb-1">Requisitos de contraseña:</div>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Mínimo 8 caracteres</li>
                            <li>Al menos una mayúscula</li>
                            <li>Al menos una minúscula</li>
                            <li>Al menos un número</li>
                            <li>Al menos un carácter especial</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      // Validar en tiempo real
                      const errors: string[] = [];
                      if (e.target.value.length > 0) {
                        if (e.target.value.length < 8) {
                          errors.push('Mínimo 8 caracteres');
                        }
                        if (!/[A-Z]/.test(e.target.value)) {
                          errors.push('Al menos una mayúscula');
                        }
                        if (!/[a-z]/.test(e.target.value)) {
                          errors.push('Al menos una minúscula');
                        }
                        if (!/[0-9]/.test(e.target.value)) {
                          errors.push('Al menos un número');
                        }
                        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(e.target.value)) {
                          errors.push('Al menos un carácter especial');
                        }
                      }
                      setPasswordErrors(errors);
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {passwordErrors.length > 0 && password && (
                    <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {passwordErrors.join(', ')}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Repetir Contraseña *
                    <div className="group relative inline-block ml-2">
                      <svg
                        className="w-4 h-4 text-gray-400 cursor-help"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64">
                        <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
                          <div className="font-semibold mb-1">Requisitos de contraseña:</div>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Mínimo 8 caracteres</li>
                            <li>Al menos una mayúscula</li>
                            <li>Al menos una minúscula</li>
                            <li>Al menos un número</li>
                            <li>Al menos un carácter especial</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                      Las contraseñas no coinciden
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rol *
              </label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  // Solo limpiar cliente si el nuevo rol no requiere cliente
                  if (e.target.value !== 'admin' && e.target.value !== 'client') {
                    setClientId(undefined);
                  }
                }}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {getAuth()?.role === 'superadmin' && (
                  <option value="superadmin">{getRoleLabel('superadmin')}</option>
                )}
                <option value="admin">{getRoleLabel('admin')}</option>
                <option value="client">{getRoleLabel('client')}</option>
              </select>
            </div>

            {(role === 'admin' || role === 'client') && isSuperadmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cliente *
                </label>
                <ClientSelect
                  value={clientId}
                  onChange={setClientId}
                  required
                  initialClient={admin?.client || undefined}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Identificación
              </label>
              <input
                type="text"
                value={identification}
                onChange={(e) => setIdentification(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                {isEditMode ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
