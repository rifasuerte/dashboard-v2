'use client';

import { useState, useEffect } from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import { useAlert } from '@/contexts/AlertContext';
import { getAuth } from '@/lib/utils/auth';
import { useClientFilter } from '@/contexts/ClientFilterContext';
import { getActiveRafflesByClient } from '@/lib/api/raffles';
import { getTopUsers, type TopUser } from '@/lib/api/tickets';
import type { Raffle } from '@/lib/utils/raffle';

interface TopUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TopUsersModal({ isOpen, onClose }: TopUsersModalProps) {
  const { showAlert } = useAlert();
  const { showLoading, hideLoading } = useLoading();
  const auth = getAuth();
  const { selectedClient } = useClientFilter();
  const [raffleId, setRaffleId] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showContactInfo, setShowContactInfo] = useState<boolean>(false);

  const isSuperadmin = auth?.role === 'superadmin';
  const clientId = isSuperadmin 
    ? selectedClient?.id 
    : auth?.client?.id;

  // Cargar rifas activas
  useEffect(() => {
    if (!isOpen || !clientId) {
      setRaffles([]);
      setRaffleId(undefined);
      return;
    }

    const loadRaffles = async () => {
      try {
        const rafflesData = await getActiveRafflesByClient(clientId);
        setRaffles(rafflesData || []);
      } catch (error) {
        console.error('Error al cargar rifas:', error);
      }
    };

    loadRaffles();
  }, [isOpen, clientId]);

  const needsClientSelection = isSuperadmin && !selectedClient;

  // Resetear cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setRaffleId(undefined);
      setStartDate('');
      setEndDate('');
      setTopUsers([]);
      setErrors({});
    }
  }, [isOpen]);

  // Buscar automáticamente cuando se seleccionan ambas fechas y la rifa
  useEffect(() => {
    // Validar que todas las condiciones estén cumplidas
    if (!raffleId || !startDate || !endDate) {
      return;
    }

    // Validar que la fecha de fin sea posterior a la de inicio
    if (new Date(startDate) > new Date(endDate)) {
      setErrors({
        endDate: 'La fecha de fin debe ser posterior a la fecha de inicio',
      });
      return;
    }

    // Limpiar errores anteriores
    setErrors({});

    // Ejecutar búsqueda
    const searchUsers = async () => {
      showLoading('Buscando usuarios destacados...');

      try {
        const users = await getTopUsers(raffleId!, startDate, endDate);
        setTopUsers(users);
      } catch (error) {
        console.error('Error al obtener usuarios destacados:', error);
        showAlert(error instanceof Error ? error.message : 'Error al obtener usuarios destacados', 'error');
        setTopUsers([]);
      } finally {
        hideLoading();
      }
    };

    // Pequeño delay para evitar múltiples llamadas mientras el usuario está seleccionando
    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [raffleId, startDate, endDate]);

  if (!isOpen) return null;

  const medals = [
    { name: 'Oro', color: 'from-yellow-400 to-yellow-600', icon: '🥇', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800' },
    { name: 'Plata', color: 'from-gray-300 to-gray-500', icon: '🥈', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' },
    { name: 'Bronce', color: 'from-orange-400 to-orange-600', icon: '🥉', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full my-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Usuarios Destacados
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Filtros */}
          <div className="space-y-4">
            {/* Mensaje para superadmin sin cliente */}
            {needsClientSelection && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Debes seleccionar un cliente
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Por favor, selecciona un cliente en el filtro global (barra superior) para poder ver las rifas disponibles.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rifa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rifa *
              </label>
              <select
                value={raffleId || ''}
                onChange={(e) => setRaffleId(e.target.value ? Number(e.target.value) : undefined)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.raffle ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } ${needsClientSelection ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={needsClientSelection || !clientId || raffles.length === 0}
              >
                <option value="">
                  {needsClientSelection 
                    ? 'Selecciona un cliente primero' 
                    : raffles.length === 0 
                      ? 'No hay rifas activas disponibles' 
                      : 'Selecciona una rifa'}
                </option>
                {raffles.map((raffle) => (
                  <option key={raffle.id} value={raffle.id}>
                    {raffle.name}
                  </option>
                ))}
              </select>
              {errors.raffle && <p className="mt-1 text-sm text-red-500">{errors.raffle}</p>}
              {!needsClientSelection && clientId && raffles.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">No hay rifas activas disponibles</p>
              )}
            </div>

            {/* Rango de fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Fin *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
              </div>
            </div>

          </div>

          {/* Resultados */}
          {topUsers.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top {topUsers.length} Usuario{topUsers.length > 1 ? 's' : ''}
                </h3>
                <button
                  onClick={() => setShowContactInfo(!showContactInfo)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  title={showContactInfo ? 'Ocultar información de contacto' : 'Mostrar información de contacto'}
                >
                  {showContactInfo ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      <span>Ocultar datos</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Mostrar datos</span>
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-3">
                {topUsers.map((item, index) => {
                  const medal = medals[index] || medals[2]; // Si hay más de 3, usar bronce
                  return (
                    <div
                      key={item.user.id}
                      className={`${medal.bg} ${medal.border} border-2 rounded-lg p-4 shadow-sm`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Medalla */}
                        <div className={`flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br ${medal.color} flex items-center justify-center text-3xl shadow-lg`}>
                          {medal.icon}
                        </div>

                        {/* Información del usuario */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                              {item.user.name}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${medal.color} text-white`}>
                              {medal.name}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>
                                {showContactInfo 
                                  ? item.user.email 
                                  : '••••••••@•••••.com'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>
                                {showContactInfo 
                                  ? item.user.phoneNumber 
                                  : '+••• ••• ••• •••'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Contador de tickets */}
                        <div className="flex-shrink-0 text-right">
                          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${medal.color} text-white font-bold text-lg shadow-lg`}>
                            {item.ticketCount}
                          </div>
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 text-center">
                            ticket{item.ticketCount > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {topUsers.length === 0 && raffleId && startDate && endDate && (
            <div className="mt-6 text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>No se encontraron usuarios en el rango de fechas seleccionado</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

