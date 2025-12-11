'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { getAuth } from '@/lib/utils/auth';
import { buildCrudQuery } from '@/lib/utils/crud-query';
import { getRafflesList } from '@/lib/api/raffles';
import { useClientFilter } from '@/contexts/ClientFilterContext';
import { PAYMENT_METHODS } from '@/lib/constants/payment-methods';
import { CURRENCIES } from '@/lib/constants/currencies';
import NavigationSidebar from '@/components/Sidebar/NavigationSidebar';
import AppHeader from '@/components/Header/AppHeader';
import Table from '@/components/Table/Table';
import ActionsMenu from '@/components/ActionsMenu/ActionsMenu';
import PaymentDetailsModal from '@/components/PaymentDetailsModal/PaymentDetailsModal';
import CashPaymentModal from '@/components/CashPaymentModal/CashPaymentModal';
import TopUsersModal from '@/components/TopUsersModal/TopUsersModal';
import type { Payment } from '@/lib/utils/payment';
import type { TableColumn } from '@/components/Table/Table';
import type { Raffle } from '@/lib/utils/raffle';

export default function TicketsPage() {
  const router = useRouter();
  const [auth, setAuth] = useState(getAuth());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [raffleFilter, setRaffleFilter] = useState<number | undefined>(undefined);
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [currencyFilter, setCurrencyFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Pendiente'); // Por defecto solo Pendiente
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const { selectedClient } = useClientFilter(); // Cliente global para superadmin
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [cashPaymentModalOpen, setCashPaymentModalOpen] = useState(false);
  const [topUsersModalOpen, setTopUsersModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const authData = getAuth();
    if (!authData) {
      router.push('/login');
      return;
    }
    
    // Todos los roles pueden ver tickets
    setAuth(authData);
  }, [router]);

  // Cargar rifas para el filtro
  useEffect(() => {
    if (!auth) return;

    const loadRaffles = async () => {
      try {
        const filter: Record<string, any> = {};
        
        // Si es admin o client, filtrar por su cliente
        if ((auth.role === 'admin' || auth.role === 'client') && auth.client) {
          filter['client.id'] = { $eq: auth.client.id };
        }
        // Si es superadmin y hay un cliente global seleccionado, filtrar por ese cliente
        else if (auth.role === 'superadmin' && selectedClient) {
          filter['client.id'] = { $eq: selectedClient.id };
        }
        // Si es superadmin sin cliente global, no aplicar filtro (todas las rifas)
        
        const response = await getRafflesList({
          page: 1,
          limit: 1000, // Cargar todas las rifas para el filtro
          filter: Object.keys(filter).length > 0 ? filter : undefined,
        });
        setRaffles(response.data || []);
      } catch (error) {
        console.error('Error al cargar rifas:', error);
      }
    };

    loadRaffles();
  }, [auth, selectedClient]);

  // Construir endpoint con filtros
  const endpoint = useMemo(() => {
    if (!auth) return '/payment';
    
    const filter: Record<string, any> = {};
    
    // Si es admin o client, filtrar por su cliente
    if ((auth.role === 'admin' || auth.role === 'client') && auth.client) {
      filter['client.id'] = { $eq: auth.client.id };
    }
    
    // Si es superadmin y hay un cliente global seleccionado, filtrar por ese cliente
    if (auth.role === 'superadmin' && selectedClient) {
      filter['client.id'] = { $eq: selectedClient.id };
    }
    
    // Filtro por rifa
    if (raffleFilter) {
      filter['raffle.id'] = { $eq: raffleFilter };
    }
    
    // Filtro por método de pago (búsqueda parcial, contiene el texto)
    if (methodFilter) {
      filter['method'] = { $contL: methodFilter };
    }
    
    // Filtro por moneda (necesitamos buscar en raffle.ticketCurrency)
    if (currencyFilter) {
      filter['raffle.ticketCurrency'] = { $eq: currencyFilter };
    }
    
    // Filtro por estado
    if (statusFilter) {
      filter['isValidated'] = { $eq: statusFilter };
    }
    
    const queryString = buildCrudQuery({
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });
    
    return `/payment${queryString ? `?${queryString}` : ''}`;
  }, [auth, selectedClient, raffleFilter, methodFilter, currencyFilter, statusFilter]);

  const columns: TableColumn<Payment>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
    },
    {
      key: 'isValidated',
      label: 'Estado',
      sortable: true,
      render: (value) => {
        const getStatusColor = (status: string) => {
          switch (status?.toLowerCase()) {
            case 'pendiente':
              return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'aprobado':
              return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'rechazado':
              return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
              return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
          }
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}
          >
            {value || 'Pendiente'}
          </span>
        );
      },
    },
    {
      key: 'method',
      label: 'Método de Pago',
      sortable: true,
      render: (value) => {
        if (!value) return <span>-</span>;
        // Quitar todo después del paréntesis si existe
        const cleanValue = value.includes('(') 
          ? value.substring(0, value.indexOf('(')).trim()
          : value;
        return <span>{cleanValue}</span>;
      },
    },
    {
      key: 'raffle.name',
      label: 'Rifa',
      sortable: true,
      render: (value, row) => {
        if (!row.raffle) {
          return <span className="text-gray-400 dark:text-gray-500">-</span>;
        }
        const raffleName = row.raffle.name || '-';
        const truncatedName = raffleName.length > 25 
          ? `${raffleName.substring(0, 25)}...` 
          : raffleName;
        return <span className="break-words">{truncatedName}</span>;
      },
    },
    {
      key: 'user.name',
      label: 'Usuario',
      sortable: true,
      render: (value, row) => {
        if (!row.user) {
          return <span className="text-gray-400 dark:text-gray-500">-</span>;
        }
        return <span>{row.user.name || '-'}</span>;
      },
    },
    {
      key: 'tickets',
      label: 'Números de Tickets',
      sortable: false,
      render: (value, row) => {
        if (!row.tickets || row.tickets.length === 0) {
          return <span className="text-gray-400 dark:text-gray-500">-</span>;
        }

        return (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(60px,1fr))] gap-1.5 max-w-[140px]">
            {row.tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs font-medium text-blue-700 dark:text-blue-300 text-center whitespace-nowrap"
              >
                {String(ticket.ticketNumber).padStart(5, '0')}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (value, row) => (
        <ActionsMenu
          onEdit={() => {
            setSelectedPayment(row);
            setDetailsModalOpen(true);
          }}
          showEdit={false}
          customActions={[
            {
              label: 'Ver Detalles',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ),
              onClick: () => {
                setSelectedPayment(row);
                setDetailsModalOpen(true);
              },
              className: 'text-blue-600 dark:text-blue-400',
            },
          ]}
        />
      ),
    },
  ];

  if (!auth) {
    return null;
  }

  const showSidebar = auth && (auth.role === 'superadmin' || auth.role === 'admin');
  
  // Para client role, también puede ver tickets pero sin sidebar

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      {/* Sidebar de Navegación */}
      {showSidebar && (
        <NavigationSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <div className={`flex-1 flex flex-col ${showSidebar ? 'lg:ml-64' : ''}`}>
        {/* Header */}
        <AppHeader
          title="Tickets"
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle={!!showSidebar}
        />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header con título y botones */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Lista de Tickets
                </h2>
                <button
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Actualizar lista"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setTopUsersModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Usuarios Destacados
                </button>
                <button
                  onClick={() => setCashPaymentModalOpen(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Registrar Pago en Efectivo
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro por Estado */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Estado:
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>

                {/* Filtro por Rifa */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Rifa:
                  </label>
                  <select
                    value={raffleFilter || ''}
                    onChange={(e) => {
                      setRaffleFilter(e.target.value ? Number(e.target.value) : undefined);
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todas</option>
                    {raffles.map((raffle) => (
                      <option key={raffle.id} value={raffle.id}>
                        {raffle.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Método de Pago */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Método:
                  </label>
                  <select
                    value={methodFilter}
                    onChange={(e) => {
                      setMethodFilter(e.target.value);
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos</option>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.name} value={method.name}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Moneda */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Moneda:
                  </label>
                  <select
                    value={currencyFilter}
                    onChange={(e) => {
                      setCurrencyFilter(e.target.value);
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todas</option>
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Table
              key={refreshKey}
              endpoint={endpoint}
              columns={columns}
              pageSize={10}
              searchFields={['user.name', 'user.email', 'user.phoneNumber', 'tickets.ticketNumber']}
            />
          </div>

          {/* Modal de Detalles */}
          <PaymentDetailsModal
            isOpen={detailsModalOpen}
            onClose={() => {
              setDetailsModalOpen(false);
              setSelectedPayment(null);
            }}
            payment={selectedPayment}
            onSuccess={() => {
              setRefreshKey((prev) => prev + 1);
            }}
          />

          {/* Modal de Pago en Efectivo */}
          <CashPaymentModal
            isOpen={cashPaymentModalOpen}
            onClose={() => setCashPaymentModalOpen(false)}
            onSuccess={() => {
              setRefreshKey((prev) => prev + 1);
            }}
          />

          {/* Modal de Usuarios Destacados */}
          <TopUsersModal
            isOpen={topUsersModalOpen}
            onClose={() => setTopUsersModalOpen(false)}
          />
        </main>
      </div>
    </div>
  );
}

