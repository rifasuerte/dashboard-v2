'use client';

import { useState, useEffect } from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import { useAlert } from '@/contexts/AlertContext';
import { getRevenueByMethod, type RevenueByMethod } from '@/lib/api/raffles';
import ImageWithGoogleDrive from '@/components/ImageWithGoogleDrive/ImageWithGoogleDrive';

interface RevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffleId: number;
  raffleName: string;
}

export default function RevenueModal({ isOpen, onClose, raffleId, raffleName }: RevenueModalProps) {
  const { showLoading, hideLoading } = useLoading();
  const { showAlert } = useAlert();
  const [revenueData, setRevenueData] = useState<RevenueByMethod[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && raffleId) {
      loadRevenueData();
    } else {
      setRevenueData([]);
    }
  }, [isOpen, raffleId]);

  const loadRevenueData = async () => {
    setLoading(true);
    showLoading('Cargando ingresos...');
    try {
      const data = await getRevenueByMethod(raffleId);
      setRevenueData(data);
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
      showAlert(error instanceof Error ? error.message : 'Error al cargar los ingresos', 'error');
    } finally {
      hideLoading();
      setLoading(false);
    }
  };

  // Calcular totales
  const totals = revenueData.reduce(
    (acc, item) => {
      // Agrupar por moneda
      if (!acc[item.currency]) {
        acc[item.currency] = { revenue: 0, ticketsCount: 0 };
      }
      acc[item.currency].revenue += item.revenue;
      acc[item.currency].ticketsCount += item.ticketsCount;
      return acc;
    },
    {} as Record<string, { revenue: number; ticketsCount: number }>
  );

  const formatCurrency = (amount: number, currency: string): string => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Ingresos por Método de Pago
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{raffleName}</p>
            </div>
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
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No hay ingresos registrados para esta rifa
            </div>
          ) : (
            <>
              {/* Lista de métodos de pago */}
              <div className="space-y-4 mb-6">
                {revenueData.map((item, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      item.visible
                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Logo */}
                        <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.logo ? (
                            <ImageWithGoogleDrive
                              src={item.logo}
                              alt={item.method}
                              className="w-full h-full object-contain"
                              fallback={
                                <div className="text-gray-400 text-xs text-center px-2">
                                  {item.method.charAt(0)}
                                </div>
                              }
                            />
                          ) : (
                            <div className="text-gray-400 text-xs text-center px-2">
                              {item.method.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Información del método */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {item.method}
                            </h3>
                            {item.visible ? (
                              <svg
                                className="w-4 h-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <title>Visible</title>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <title>Oculto</title>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.ticketsCount} ticket{item.ticketsCount !== 1 ? 's' : ''} vendido{item.ticketsCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Ingresos */}
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(item.revenue, item.currency)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Ingresos
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Totales
                </h3>
                <div className="space-y-2">
                  {Object.entries(totals).map(([currency, total]) => (
                    <div
                      key={currency}
                      className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
                    >
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          Total en {currency}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {total.ticketsCount} ticket{total.ticketsCount !== 1 ? 's' : ''} vendido{total.ticketsCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(total.revenue, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer con botón cerrar */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

