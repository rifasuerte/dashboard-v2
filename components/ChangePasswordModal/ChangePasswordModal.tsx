'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api/client';
import { useLoading } from '@/contexts/LoadingContext';
import type { AuthResponse } from '@/lib/utils/auth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  admin: AuthResponse;
}

interface ChangePasswordDto {
  newPassword: string;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
  admin,
}: ChangePasswordModalProps) {
  const { showLoading, hideLoading } = useLoading();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!newPassword) {
      setError('La nueva contraseña es requerida');
      return;
    }

    // Validar requisitos de contraseña
    const errors: string[] = [];
    if (newPassword.length < 8) {
      errors.push('Mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(newPassword)) {
      errors.push('Al menos una mayúscula');
    }
    if (!/[a-z]/.test(newPassword)) {
      errors.push('Al menos una minúscula');
    }
    if (!/[0-9]/.test(newPassword)) {
      errors.push('Al menos un número');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      errors.push('Al menos un carácter especial');
    }
    
    if (errors.length > 0) {
      setError(`La contraseña debe cumplir: ${errors.join(', ')}`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    showLoading('Cambiando contraseña...');

    try {
      const data: ChangePasswordDto = {
        newPassword,
      };

      await apiRequest(`/admin/${admin.id}/change-password`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      hideLoading();
      onSuccess();
      onClose();
      // Resetear formulario
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      hideLoading();
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Cambiar Contraseña
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
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nueva Contraseña *
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
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
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
              {passwordErrors.length > 0 && newPassword && (
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {passwordErrors.join(', ')}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Contraseña *
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
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Las contraseñas no coinciden
                </div>
              )}
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
                Cambiar Contraseña
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
