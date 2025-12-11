'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLoading } from '@/contexts/LoadingContext';
import { useAlert } from '@/contexts/AlertContext';
import { getPurchasedTickets, type PurchasedTicket } from '@/lib/api/raffles';
import ExportTicketsModal from '@/components/ExportTicketsModal/ExportTicketsModal';

interface TicketNumbersModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffleId: number;
  ticketLimit: number;
  raffleName: string;
}

export default function TicketNumbersModal({
  isOpen,
  onClose,
  raffleId,
  ticketLimit,
  raffleName,
}: TicketNumbersModalProps) {
  const { showLoading, hideLoading } = useLoading();
  const { showAlert } = useAlert();
  const [purchasedTickets, setPurchasedTickets] = useState<PurchasedTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hoveredTicket, setHoveredTicket] = useState<{ number: number; x: number; y: number } | null>(null);
  const [isHoveringTooltip, setIsHoveringTooltip] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ticketRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (isOpen && raffleId) {
      loadPurchasedTickets();
    }
    
    // Limpiar timeout al desmontar
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isOpen, raffleId]);

  const loadPurchasedTickets = async () => {
    setLoading(true);
    showLoading('Cargando números de tickets...');
    try {
      const tickets = await getPurchasedTickets(raffleId);
      setPurchasedTickets(tickets);
    } catch (error) {
      console.error('Error al cargar tickets:', error);
      showAlert(error instanceof Error ? error.message : 'Error al cargar tickets', 'error');
    } finally {
      hideLoading();
      setLoading(false);
    }
  };

  const getTicketStatus = (ticketNumber: number): 'available' | 'paid' | 'pending' => {
    const ticket = purchasedTickets.find((t) => t.number === ticketNumber);
    if (!ticket) return 'available';
    return ticket.isPaid ? 'paid' : 'pending';
  };

  const getTicketInfo = (ticketNumber: number): PurchasedTicket | null => {
    return purchasedTickets.find((t) => t.number === ticketNumber) || null;
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  const formatTicketNumber = (num: number): string => {
    return num.toString().padStart(5, '0');
  };

  const handleMouseEnter = (number: number) => {
    // Cancelar cualquier timeout pendiente
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    const element = ticketRefs.current[number];
    if (element) {
      const rect = element.getBoundingClientRect();
      setHoveredTicket({
        number,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setIsHoveringTooltip(false);
    }
  };

  const handleMouseLeave = () => {
    // Dar un pequeño delay antes de ocultar para permitir mover el mouse al tooltip
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHoveringTooltip) {
        setHoveredTicket(null);
      }
    }, 100);
  };

  if (!isOpen) return null;

  // Crear array de números del 0 al ticketLimit - 1
  const ticketNumbers = Array.from({ length: ticketLimit }, (_, i) => i);

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[95vw] h-[90vh] max-w-7xl flex flex-col relative z-[60]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Números de Tickets - {raffleName}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total: {ticketLimit} tickets (0 - {ticketLimit - 1})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExportModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                title="Exportar tickets"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Cerrar"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 relative z-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 xl:grid-cols-20 gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))' }}>
                {ticketNumbers.map((number) => {
                  const status = getTicketStatus(number);
                  const ticketInfo = getTicketInfo(number);
                  const formattedNumber = formatTicketNumber(number);

                  let bgColor = '';
                  let borderColor = '';
                  let textColor = '';

                  if (status === 'available') {
                    bgColor = 'bg-green-100 dark:bg-green-900/30';
                    borderColor = 'border-green-500 dark:border-green-600';
                    textColor = 'text-green-800 dark:text-green-300';
                  } else if (status === 'paid') {
                    bgColor = 'bg-red-100 dark:bg-red-900/30';
                    borderColor = 'border-red-500 dark:border-red-600';
                    textColor = 'text-red-800 dark:text-red-300';
                  } else {
                    bgColor = 'bg-orange-100 dark:bg-orange-900/30';
                    borderColor = 'border-orange-500 dark:border-orange-600';
                    textColor = 'text-orange-800 dark:text-orange-300';
                  }

                  return (
                    <div
                      key={number}
                      ref={(el) => {
                        ticketRefs.current[number] = el;
                      }}
                      className={`${bgColor} ${borderColor} ${textColor} border-2 rounded-lg p-2 text-center cursor-pointer hover:scale-105 transition-transform z-0`}
                      onMouseEnter={() => handleMouseEnter(number)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="text-xs font-semibold">{formattedNumber}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded border-2 border-green-600"></div>
                <span className="text-gray-700 dark:text-gray-300">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded border-2 border-orange-600"></div>
                <span className="text-gray-700 dark:text-gray-300">Por Validar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded border-2 border-red-600"></div>
                <span className="text-gray-700 dark:text-gray-300">Pagado</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Tooltip Portal */}
      {hoveredTicket && typeof window !== 'undefined' && createPortal(
        (() => {
          const ticketInfo = getTicketInfo(hoveredTicket.number);
          const status = getTicketStatus(hoveredTicket.number);
          const tooltipText = status === 'available' ? 'Disponible' : status === 'paid' ? 'PAGADO' : 'POR VALIDAR';
          
          if (!ticketInfo) {
            return (
              <div
                className="fixed z-[200] w-32 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl p-2 text-center pointer-events-auto"
                style={{
                  left: `${hoveredTicket.x}px`,
                  top: `${hoveredTicket.y - 10}px`,
                  transform: 'translate(-50%, -100%)',
                }}
                onMouseEnter={() => {
                  if (hideTimeoutRef.current) {
                    clearTimeout(hideTimeoutRef.current);
                    hideTimeoutRef.current = null;
                  }
                  setIsHoveringTooltip(true);
                }}
                onMouseLeave={() => {
                  setIsHoveringTooltip(false);
                  hideTimeoutRef.current = setTimeout(() => {
                    setHoveredTicket(null);
                  }, 100);
                }}
              >
                {tooltipText}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              </div>
            );
          }

          return (
            <div
              className="fixed z-[200] w-64 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl p-3 pointer-events-auto"
              style={{
                left: `${hoveredTicket.x}px`,
                top: `${hoveredTicket.y - 10}px`,
                transform: 'translate(-50%, -100%)',
              }}
              onMouseEnter={() => {
                if (hideTimeoutRef.current) {
                  clearTimeout(hideTimeoutRef.current);
                  hideTimeoutRef.current = null;
                }
                setIsHoveringTooltip(true);
              }}
              onMouseLeave={() => {
                setIsHoveringTooltip(false);
                hideTimeoutRef.current = setTimeout(() => {
                  setHoveredTicket(null);
                }, 100);
              }}
            >
              <div className="font-bold mb-2 text-center border-b border-gray-600 pb-1">
                {tooltipText}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Nombre:</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(ticketInfo.user.name, `name-${hoveredTicket.number}`);
                    }}
                    className="flex items-center gap-1 text-white hover:text-blue-300 transition-colors"
                  >
                    <span className="truncate max-w-[150px]">{ticketInfo.user.name}</span>
                    {copiedField === `name-${hoveredTicket.number}` ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Email:</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(ticketInfo.user.email, `email-${hoveredTicket.number}`);
                    }}
                    className="flex items-center gap-1 text-white hover:text-blue-300 transition-colors"
                  >
                    <span className="truncate max-w-[150px]">{ticketInfo.user.email}</span>
                    {copiedField === `email-${hoveredTicket.number}` ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Teléfono:</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(ticketInfo.user.phone, `phone-${hoveredTicket.number}`);
                    }}
                    className="flex items-center gap-1 text-white hover:text-blue-300 transition-colors"
                  >
                    <span className="truncate max-w-[150px]">{ticketInfo.user.phone}</span>
                    {copiedField === `phone-${hoveredTicket.number}` ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
              </div>
            </div>
          );
        })(),
        document.body
      )}

      {/* Modal de Exportación */}
      <ExportTicketsModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        ticketNumbers={ticketNumbers}
        purchasedTickets={purchasedTickets}
        raffleName={raffleName}
      />
    </>
  );
}
