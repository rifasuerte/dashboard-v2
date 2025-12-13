'use client';

import { useState, useEffect } from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import { useAlert } from '@/contexts/AlertContext';
import { useClientFilter } from '@/contexts/ClientFilterContext';
import { getSuperadminStats, type SuperadminStats, type AdminStats, type ClientStats, type RaffleStats } from '@/lib/api/stats';
import ShareRaffleModal from '@/components/ShareRaffleModal/ShareRaffleModal';
import RevenueModal from '@/components/RevenueModal/RevenueModal';
import TicketNumbersModal from '@/components/TicketNumbersModal/TicketNumbersModal';

export default function StatsDashboard() {
  const { showLoading, hideLoading } = useLoading();
  const { showAlert } = useAlert();
  const { selectedClient } = useClientFilter();
  const [stats, setStats] = useState<SuperadminStats | AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState<{ innerCode: string; name: string; domain: string } | null>(null);
  const [showRevenue, setShowRevenue] = useState<boolean>(false);
  const [ticketNumbersModalOpen, setTicketNumbersModalOpen] = useState(false);
  const [selectedRaffleForTickets, setSelectedRaffleForTickets] = useState<{ id: number; name: string; ticketLimit: number } | null>(null);
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [selectedRaffleForRevenue, setSelectedRaffleForRevenue] = useState<{ id: number; name: string } | null>(null);
  const [minimizedRaffles, setMinimizedRaffles] = useState<Set<number>>(new Set());
  const [onlyActive, setOnlyActive] = useState<boolean>(true); // Por defecto solo activas

  useEffect(() => {
    const loadStats = async () => {
      showLoading('Cargando estadísticas...');
      setLoading(true);
      try {
        // Si hay un cliente global seleccionado, enviar su ID
        const clientId = selectedClient?.id;
        const data = await getSuperadminStats(clientId, onlyActive);
        setStats(data);
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        showAlert(error instanceof Error ? error.message : 'Error al cargar estadísticas', 'error');
      } finally {
        hideLoading();
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedClient, onlyActive]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No hay estadísticas disponibles
      </div>
    );
  }

  // Determinar si es SuperadminStats (con array de clientes) o AdminStats (con un solo cliente)
  const isSuperadminStats = 'clients' in stats && Array.isArray((stats as any).clients);
  const clients = isSuperadminStats 
    ? (stats as SuperadminStats).clients 
    : [{
        id: (stats as AdminStats).client.id,
        name: (stats as AdminStats).client.name,
        fantasyName: (stats as AdminStats).client.fantasyName,
        domain: (stats as AdminStats).client.domain,
        totalRaffles: (stats as AdminStats).totalRaffles,
        activeRaffles: (stats as AdminStats).activeRaffles,
        closedRaffles: (stats as AdminStats).closedRaffles,
        raffles: (stats as AdminStats).raffles.map(r => ({
          id: r.id,
          name: r.name,
          isActive: r.isActive,
          ticketsSold: r.ticketsSold,
          revenue: r.revenue,
          ticketLimit: r.ticketLimit,
          ticketCurrency: r.ticketCurrency,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      }];
  
  const totalClients = isSuperadminStats ? (stats as SuperadminStats).totalClients : clients.length;

  const calculateProgress = (ticketsSold: number, ticketLimit: number): number => {
    if (ticketLimit === 0) return 0;
    return Math.min(100, (ticketsSold / ticketLimit) * 100);
  };

  const formatCurrency = (amount: number, currency?: string): string => {
    const formatted = new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    // Si no hay moneda, usar USD por defecto
    return `${formatted} ${currency || 'USD'}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con resumen general */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl shadow-xl p-8 text-white relative">
        <div className="absolute top-6 right-6 flex flex-col gap-2">
          <button
            onClick={() => setShowRevenue(!showRevenue)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors"
            title={showRevenue ? 'Ocultar ventas' : 'Mostrar ventas'}
          >
            {showRevenue ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <span>Ocultar ventas</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Mostrar ventas</span>
              </>
            )}
          </button>
          <button
            onClick={() => setOnlyActive(!onlyActive)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
              onlyActive
                ? 'bg-green-500/90 hover:bg-green-500 text-white'
                : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white'
            }`}
            title={onlyActive ? 'Mostrar todas las rifas' : 'Mostrar solo rifas activas'}
          >
            {onlyActive ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Solo Activas</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Todas</span>
              </>
            )}
          </button>
        </div>
        <h1 className="text-3xl font-bold mb-2">Panel de Estadísticas</h1>
        <p className="text-blue-100 text-lg">
          Resumen general de todos los clientes y sus rifas
        </p>
        <div className="mt-6 flex items-center gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
            <div className="text-blue-100 text-sm font-medium mb-1">Total de Clientes</div>
            <div className="text-4xl font-bold">{totalClients}</div>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="space-y-6">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header del cliente */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {client.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {client.fantasyName} •{' '}
                    <a
                      href={`https://${client.domain}.rifasuerte.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors inline-flex items-center gap-1"
                    >
                      {client.domain}.rifasuerte.com
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {client.totalRaffles}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Rifas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {client.activeRaffles}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Activas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {client.closedRaffles}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Cerradas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de rifas */}
            <div className="p-6 space-y-4">
              {client.raffles.map((raffle) => {
                const progress = calculateProgress(raffle.ticketsSold, raffle.ticketLimit);
                const progressColor = progress >= 75 
                  ? 'bg-green-500' 
                  : progress >= 50 
                  ? 'bg-yellow-500' 
                  : 'bg-blue-500';

                const isMinimized = minimizedRaffles.has(raffle.id);
                
                return (
                  <div
                    key={raffle.id}
                    className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Header de la rifa */}
                    <div className={`p-6 ${isMinimized ? '' : 'border-b border-gray-200 dark:border-gray-700'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                        {/* Card de innerCode si existe */}
                        {'innerCode' in raffle && raffle.innerCode && (
                          <a
                            href={`https://${client.domain}.rifasuerte.com/rifa/${(raffle as RaffleStats).innerCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mb-3 inline-block bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                                  Código Interno
                                </div>
                                <div className="text-lg font-bold text-blue-900 dark:text-blue-100 font-mono">
                                  {(raffle as RaffleStats).innerCode}
                                </div>
                              </div>
                              <svg
                                className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </div>
                          </a>
                        )}
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {raffle.name}
                          </h3>
                          <button
                            onClick={() => {
                              const newMinimized = new Set(minimizedRaffles);
                              if (isMinimized) {
                                newMinimized.delete(raffle.id);
                              } else {
                                newMinimized.add(raffle.id);
                              }
                              setMinimizedRaffles(newMinimized);
                            }}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title={isMinimized ? 'Expandir' : 'Minimizar'}
                          >
                            <svg
                              className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${isMinimized ? '' : 'rotate-180'}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedRaffleForTickets({
                                  id: raffle.id,
                                  name: raffle.name,
                                  ticketLimit: raffle.ticketLimit,
                                });
                                setTicketNumbersModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                              title="Ver números de tickets"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Ver Tickets
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRaffleForRevenue({
                                  id: raffle.id,
                                  name: raffle.name,
                                });
                                setRevenueModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                              title="Ver ingresos"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Ver Ingresos
                            </button>
                            <button
                              onClick={() => {
                                if (!('innerCode' in raffle) || !raffle.innerCode) {
                                  showAlert('Esta rifa no tiene código interno', 'warning');
                                  return;
                                }
                                setSelectedRaffle({
                                  innerCode: (raffle as RaffleStats).innerCode!,
                                  name: raffle.name,
                                  domain: client.domain,
                                });
                                setShareModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                              title="Compartir rifa"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                              </svg>
                              Compartir
                            </button>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              raffle.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {raffle.isActive ? 'Activa' : 'Cerrada'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>Creada: {formatDate(raffle.createdAt)}</span>
                          {raffle.updatedAt !== raffle.createdAt && (
                            <span>Actualizada: {formatDate(raffle.updatedAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {showRevenue ? formatCurrency(raffle.revenue, raffle.ticketCurrency) : '***'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total Vendido
                        </div>
                      </div>
                    </div>
                    </div>

                    {/* Contenido de la rifa (solo se muestra si no está minimizada) */}
                    {!isMinimized && (
                      <div className="p-6 pt-0">
                    {/* Barra de progreso */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Progreso de Venta
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {raffle.ticketsSold} / {raffle.ticketLimit} tickets
                          </span>
                        </div>
                      </div>
                      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden shadow-inner">
                        <div
                          className={`h-full ${progressColor} rounded-full transition-all duration-500 ease-out`}
                          style={{ width: `${progress}%` }}
                        />
                        {/* Porcentaje centrado sobre la barra */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-gray-900 dark:text-white drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas adicionales */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Tickets Vendidos
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {raffle.ticketsSold}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Límite de Tickets
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {raffle.ticketLimit}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Disponibles
                        </div>
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {raffle.ticketLimit - raffle.ticketsSold}
                        </div>
                      </div>
                    </div>
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de compartir */}
      {selectedRaffle && (
        <ShareRaffleModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedRaffle(null);
          }}
          innerCode={selectedRaffle.innerCode}
          raffleName={selectedRaffle.name}
          domain={selectedRaffle.domain}
        />
      )}

      {ticketNumbersModalOpen && selectedRaffleForTickets && (
        <TicketNumbersModal
          isOpen={ticketNumbersModalOpen}
          onClose={() => {
            setTicketNumbersModalOpen(false);
            setSelectedRaffleForTickets(null);
          }}
          raffleId={selectedRaffleForTickets.id}
          ticketLimit={selectedRaffleForTickets.ticketLimit}
          raffleName={selectedRaffleForTickets.name}
        />
      )}

      <RevenueModal
        isOpen={revenueModalOpen}
        onClose={() => {
          setRevenueModalOpen(false);
          setSelectedRaffleForRevenue(null);
        }}
        raffleId={selectedRaffleForRevenue?.id || 0}
        raffleName={selectedRaffleForRevenue?.name || ''}
      />
    </div>
  );
}

