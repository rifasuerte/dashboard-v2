'use client';

import type { Raffle, WinningTicket } from '@/lib/utils/raffle';

interface WinningTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: Raffle | null;
}

export default function WinningTicketsModal({ isOpen, onClose, raffle }: WinningTicketsModalProps) {
  if (!isOpen || !raffle) return null;

  const winningTickets = raffle.winningTickets || [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tickets Ganadores - {raffle.name}
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

          {/* Lista de tickets ganadores */}
          {winningTickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No hay tickets ganadores registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {winningTickets.map((ticket, index) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-green-50 dark:bg-green-900/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Ticket #{String(ticket.ticketNumber).padStart(5, '0')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ganador {index + 1} de {winningTickets.length}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                    Ganador
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botón cerrar */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

