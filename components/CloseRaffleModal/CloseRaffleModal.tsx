'use client';

import { useState, useEffect } from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import { useAlert } from '@/contexts/AlertContext';
import { drawRaffle } from '@/lib/api/raffles';
import type { Raffle } from '@/lib/utils/raffle';

interface CloseRaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  raffle: Raffle | null;
}

export default function CloseRaffleModal({ isOpen, onClose, onSuccess, raffle }: CloseRaffleModalProps) {
  const { showLoading, hideLoading } = useLoading();
  const { showAlert } = useAlert();
  const [winningNumbers, setWinningNumbers] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && raffle) {
      // Inicializar array de números ganadores según numberOfWinners
      const count = raffle.numberOfWinners || 1;
      setWinningNumbers(Array(count).fill(''));
    }
  }, [isOpen, raffle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!raffle) return;

    // Si winningBySystem es false, validar que todos los números estén ingresados
    if (!raffle.winningBySystem) {
      const emptyNumbers = winningNumbers.some(num => !num.trim());
      if (emptyNumbers) {
        showAlert('Por favor ingresa todos los números ganadores', 'warning');
        return;
      }
    }

    showLoading('Cerrando rifa...');

    try {
      const data: { winningNumbers?: string[] } = {};
      
      // Solo enviar winningNumbers si winningBySystem es false
      if (!raffle.winningBySystem) {
        data.winningNumbers = winningNumbers.map(num => num.trim());
      }

      await drawRaffle(raffle.id, data);
      hideLoading();
      onSuccess();
      onClose();
    } catch (err) {
      hideLoading();
      showAlert(err instanceof Error ? err.message : 'Error al cerrar la rifa', 'error');
    }
  };

  const handleNumberChange = (index: number, value: string) => {
    const newNumbers = [...winningNumbers];
    newNumbers[index] = value;
    setWinningNumbers(newNumbers);
  };

  if (!isOpen || !raffle) return null;

  const needsWinningNumbers = !raffle.winningBySystem;
  const numberOfWinners = raffle.numberOfWinners || 1;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cerrar Rifa
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
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {needsWinningNumbers
                  ? `Ingresa los ${numberOfWinners} número${numberOfWinners > 1 ? 's' : ''} ganador${numberOfWinners > 1 ? 'es' : ''}:`
                  : 'La rifa se cerrará automáticamente. El sistema seleccionará los ganadores.'}
              </p>
            </div>

            {needsWinningNumbers && (
              <div className="space-y-3">
                {winningNumbers.map((number, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número Ganador {index + 1} *
                    </label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => handleNumberChange(index, e.target.value)}
                      required={needsWinningNumbers}
                      placeholder={`Ganador ${index + 1}`}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones fijos en el footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Cerrar Rifa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

