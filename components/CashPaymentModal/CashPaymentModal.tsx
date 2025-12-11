'use client';

import { useState, useEffect } from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import { useAlert } from '@/contexts/AlertContext';
import { getAuth } from '@/lib/utils/auth';
import { useClientFilter } from '@/contexts/ClientFilterContext';
import { registerUser, type RegisterUserDto } from '@/lib/api/users';
import { createPayment, type CreatePaymentDto } from '@/lib/api/payments';
import { createTicket } from '@/lib/api/tickets';
import { getRafflesList, getRaffleById, getActiveRafflesByClient } from '@/lib/api/raffles';
import ClientSelect from '@/components/ClientSelect/ClientSelect';
import type { Client } from '@/lib/utils/auth';
import type { Raffle } from '@/lib/utils/raffle';

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CashPaymentModal({ isOpen, onClose, onSuccess }: CashPaymentModalProps) {
  const { showLoading, hideLoading } = useLoading();
  const { showAlert } = useAlert();
  const auth = getAuth();
  const { selectedClient } = useClientFilter();
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(undefined);
  const [raffleId, setRaffleId] = useState<number | undefined>(undefined);
  const [numberOfTickets, setNumberOfTickets] = useState<number>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSuperadmin = auth?.role === 'superadmin';
  const clientId = isSuperadmin 
    ? (selectedClientId || selectedClient?.id) 
    : auth?.client?.id;

  // Cargar rifas activas cuando cambia el cliente
  useEffect(() => {
    if (!isOpen || !clientId) {
      setRaffles([]);
      setRaffleId(undefined);
      setSelectedRaffle(undefined);
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

  // Actualizar rifa seleccionada cuando cambia raffleId
  useEffect(() => {
    if (!raffleId) {
      setSelectedRaffle(undefined);
      return;
    }

    const raffle = raffles.find((r) => r.id === raffleId);
    if (raffle) {
      setSelectedRaffle(raffle);
      
      // Calcular tickets disponibles usando ticketsCount
      const ticketsSold = raffle.ticketsCount || 0;
      const availableTickets = Math.max(0, raffle.ticketLimit - ticketsSold);
      const minTickets = raffle.minTickets || 1;
      
      // Ajustar numberOfTickets según los límites
      if (numberOfTickets > availableTickets) {
        setNumberOfTickets(availableTickets > 0 ? Math.max(minTickets, availableTickets) : 0);
      } else if (numberOfTickets < minTickets && availableTickets > 0) {
        setNumberOfTickets(minTickets);
      } else if (availableTickets === 0) {
        setNumberOfTickets(0);
      }
    }
  }, [raffleId, raffles, numberOfTickets]);

  // Calcular tickets disponibles y límites
  const ticketsSold = selectedRaffle?.ticketsCount || 0;
  const availableTickets = selectedRaffle ? Math.max(0, selectedRaffle.ticketLimit - ticketsSold) : 0;
  const minTickets = selectedRaffle?.minTickets || 1;
  const maxTickets = availableTickets;

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      if (isSuperadmin) {
        setSelectedClientId(selectedClient?.id);
      } else {
        setSelectedClientId(undefined);
      }
      setRaffleId(undefined);
      setNumberOfTickets(1);
      setName('');
      setEmail('');
      setPhoneNumber('');
      setErrors({});
    }
  }, [isOpen, isSuperadmin, selectedClient]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isSuperadmin && !clientId) {
      newErrors.client = 'Debes seleccionar un cliente';
    }

    if (!raffleId) {
      newErrors.raffle = 'Debes seleccionar una rifa';
    }

    if (!numberOfTickets || numberOfTickets < minTickets) {
      newErrors.numberOfTickets = `Debes comprar al menos ${minTickets} ticket${minTickets > 1 ? 's' : ''}`;
    }
    
    if (numberOfTickets > maxTickets) {
      newErrors.numberOfTickets = `Solo quedan ${maxTickets} ticket${maxTickets > 1 ? 's' : ''} disponible${maxTickets > 1 ? 's' : ''}`;
    }
    
    if (availableTickets === 0) {
      newErrors.raffle = 'Esta rifa no tiene tickets disponibles';
    }

    if (!name?.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!email?.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!phoneNumber?.trim()) {
      newErrors.phoneNumber = 'El teléfono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !clientId) return;

    showLoading('Registrando pago en efectivo...');
    try {
      // 1. Registrar usuario
      const userData: RegisterUserDto = {
        email,
        name,
        password: 'A123456', // Contraseña por defecto
        phoneNumber,
        client: clientId,
      };
      const user = await registerUser(userData);

      // 2. Crear pago
      const paymentData: CreatePaymentDto = {
        voucher: 'n/a',
        method: 'Efectivo',
        raffle: raffleId!,
        user: user.id,
      };
      const payment = await createPayment(paymentData);

      // 3. Crear tickets
      await createTicket({
        userId: user.id,
        numberOfTicketsToBuy: numberOfTickets,
        raffleId: raffleId!,
        paymentId: payment.id,
        isCash: true,
      });

      hideLoading();
      onSuccess();
      onClose();
    } catch (error) {
      hideLoading();
      showAlert(error instanceof Error ? error.message : 'Error al registrar el pago en efectivo', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full my-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Registrar Pago en Efectivo
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cliente (solo para superadmin) */}
          {isSuperadmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cliente *
              </label>
              <ClientSelect
                value={selectedClientId}
                onChange={(clientId) => setSelectedClientId(clientId)}
                required
                initialClient={selectedClient || undefined}
              />
              {errors.client && <p className="mt-1 text-sm text-red-500">{errors.client}</p>}
            </div>
          )}

          {/* Rifa y Cantidad de Tickets - lado a lado */}
          <div className="grid grid-cols-2 gap-4">
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
                }`}
                disabled={!clientId || raffles.length === 0}
              >
                <option value="">Selecciona una rifa</option>
                {raffles.map((raffle) => (
                  <option key={raffle.id} value={raffle.id}>
                    {raffle.name}
                  </option>
                ))}
              </select>
              {errors.raffle && <p className="mt-1 text-sm text-red-500">{errors.raffle}</p>}
              {clientId && raffles.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">No hay rifas disponibles</p>
              )}
            </div>

            {/* Cantidad de Tickets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cantidad de Tickets *
              </label>
              <input
                type="number"
                min={minTickets}
                max={maxTickets}
                value={numberOfTickets}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= minTickets && value <= maxTickets) {
                    setNumberOfTickets(value);
                  }
                }}
                disabled={!selectedRaffle || availableTickets === 0}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.numberOfTickets ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } ${(!selectedRaffle || availableTickets === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.numberOfTickets && (
                <p className="mt-1 text-sm text-red-500">{errors.numberOfTickets}</p>
              )}
            </div>
          </div>

          {/* Información de tickets y precio total */}
          {selectedRaffle && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Tickets vendidos:</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {ticketsSold} / {selectedRaffle.ticketLimit}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Tickets disponibles:</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">{availableTickets}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Mínimo de compra:</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {minTickets} ticket{minTickets > 1 ? 's' : ''}
                  </p>
                </div>
                {numberOfTickets > 0 && (
                  <div>
                  <p className="text-gray-600 dark:text-gray-400">Total a pagar:</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400 text-lg">
                    {(parseFloat(selectedRaffle.ticketPrice) * numberOfTickets).toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {selectedRaffle.ticketCurrency}
                  </p>
                </div>
                )}
              </div>
            </div>
          )}

          {/* Nombre y Email - lado a lado */}
          <div className="grid grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Registrar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

