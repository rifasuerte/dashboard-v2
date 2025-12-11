'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { getAuth } from '@/lib/utils/auth';
import { buildCrudQuery } from '@/lib/utils/crud-query';
import NavigationSidebar from '@/components/Sidebar/NavigationSidebar';
import AppHeader from '@/components/Header/AppHeader';
import Table from '@/components/Table/Table';
import RaffleModal from '@/components/RaffleModal/RaffleModal';
import CloseRaffleModal from '@/components/CloseRaffleModal/CloseRaffleModal';
import WinningTicketsModal from '@/components/WinningTicketsModal/WinningTicketsModal';
import ActionsMenu from '@/components/ActionsMenu/ActionsMenu';
import type { Raffle } from '@/lib/utils/raffle';
import type { TableColumn } from '@/components/Table/Table';

export default function RifasPage() {
  const router = useRouter();
  const [auth, setAuth] = useState(getAuth());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [winningTicketsModalOpen, setWinningTicketsModalOpen] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>(''); // '' = todos, 'true' = activas, 'false' = cerradas

  useEffect(() => {
    const authData = getAuth();
    if (!authData) {
      router.push('/login');
      return;
    }
    
    // Solo permitir acceso a superadmin y admin
    if (authData.role !== 'superadmin' && authData.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    setAuth(authData);
  }, [router]);

  const handleCreate = () => {
    setSelectedRaffle(null);
    setCreateModalOpen(true);
  };

  const handleEdit = (raffle: Raffle) => {
    // No permitir editar si la rifa está cerrada
    if (!raffle.isActive) {
      return;
    }
    setSelectedRaffle(raffle);
    setEditModalOpen(true);
  };

  const handleClose = (raffle: Raffle) => {
    setSelectedRaffle(raffle);
    setCloseModalOpen(true);
  };

  const handleViewWinners = (raffle: Raffle) => {
    setSelectedRaffle(raffle);
    setWinningTicketsModalOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Construir endpoint con filtros
  const endpoint = useMemo(() => {
    if (!auth) return '/raffle';
    
    const filter: Record<string, any> = {};
    
    // Si es admin, filtrar por su cliente
    if (auth.role === 'admin' && auth.client) {
      filter['client.id'] = { $eq: auth.client.id };
    }
    
    // Filtro por estado (isActive)
    if (statusFilter !== '') {
      filter['isActive'] = { $eq: statusFilter === 'true' };
    }
    
    const queryString = buildCrudQuery({
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });
    
    return `/raffle${queryString ? `?${queryString}` : ''}`;
  }, [auth, statusFilter]);

  const columns: TableColumn<Raffle>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
    },
    ...(auth?.role === 'superadmin' ? [{
      key: 'client.name',
      label: 'Cliente',
      sortable: true,
      render: (value: any, row: Raffle) => {
        if (!row.client) {
          return <span className="text-gray-400 dark:text-gray-500">-</span>;
        }
        return <span className="break-words">{row.client.name || '-'}</span>;
      },
    }] : []),
    {
      key: 'ticketLimit',
      label: 'Límite Tickets',
      sortable: true,
    },
    {
      key: 'ticketPrice',
      label: 'Precio Ticket',
      sortable: true,
      render: (value, row) => (
        <span>{value} {row.ticketCurrency}</span>
      ),
    },
    {
      key: 'date',
      label: 'Fecha',
      sortable: true,
      render: (value) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleDateString('es-ES');
      },
    },
    {
      key: 'isActive',
      label: 'Estado',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {value ? 'Activa' : 'Cerrada'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (value, row) => {
        const isClosed = !row.isActive;
        const customActions = [];
        
        if (isClosed) {
          // Si está cerrada, mostrar "Ver Ganadores"
          customActions.push({
            label: 'Ver Ganadores',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ),
            onClick: () => handleViewWinners(row),
            className: 'text-green-600 dark:text-green-400',
          });
        } else {
          // Si está activa, mostrar "Cerrar Rifa"
          customActions.push({
            label: 'Cerrar Rifa',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ),
            onClick: () => handleClose(row),
            className: 'text-red-600 dark:text-red-400',
          });
        }
        
        return (
          <ActionsMenu
            onEdit={() => handleEdit(row)}
            showEdit={!isClosed}
            customActions={customActions}
          />
        );
      },
    },
  ];

  const showSidebar = auth && (auth.role === 'superadmin' || auth.role === 'admin');
  
  // Mostrar botón crear solo si es superadmin o si es admin y su cliente es autoadministrable
  const canCreateRaffle = auth?.role === 'superadmin' || (auth?.role === 'admin' && auth?.client?.autoadminitrable === true);

  if (!auth) {
    return null;
  }

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
          title="Rifas"
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle={!!showSidebar}
        />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header con título y botón crear */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Lista de Rifas
              </h2>
              {canCreateRaffle && (
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Crear Rifa
                </button>
              )}
            </div>

            {/* Filtros */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex flex-wrap items-center gap-3">
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
                  <option value="">Todas</option>
                  <option value="true">Abiertas</option>
                  <option value="false">Cerradas</option>
                </select>
              </div>
            </div>

            <Table
              key={refreshKey}
              endpoint={endpoint}
              columns={columns}
              pageSize={10}
              searchFields={['name']}
            />
          </div>

          {/* Modales */}
          <RaffleModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSuccess={handleSuccess}
            raffle={null}
          />
          <RaffleModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSuccess={handleSuccess}
            raffle={selectedRaffle}
          />
          <CloseRaffleModal
            isOpen={closeModalOpen}
            onClose={() => {
              setCloseModalOpen(false);
              setSelectedRaffle(null);
            }}
            onSuccess={handleSuccess}
            raffle={selectedRaffle}
          />
          <WinningTicketsModal
            isOpen={winningTicketsModalOpen}
            onClose={() => {
              setWinningTicketsModalOpen(false);
              setSelectedRaffle(null);
            }}
            raffle={selectedRaffle}
          />
        </main>
      </div>
    </div>
  );
}

