'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { getAuth } from '@/lib/utils/auth';
import { buildCrudQuery } from '@/lib/utils/crud-query';
import { useClientFilter } from '@/contexts/ClientFilterContext';
import NavigationSidebar from '@/components/Sidebar/NavigationSidebar';
import AppHeader from '@/components/Header/AppHeader';
import Table from '@/components/Table/Table';
import UserModal from '@/components/UserModal/UserModal';
import ChangeUserPasswordModal from '@/components/ChangeUserPasswordModal/ChangeUserPasswordModal';
import ActionsMenu from '@/components/ActionsMenu/ActionsMenu';
import type { User } from '@/lib/utils/user';
import type { TableColumn } from '@/components/Table/Table';

export default function UsuariosPage() {
  const router = useRouter();
  const [auth, setAuth] = useState(getAuth());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedClient } = useClientFilter(); // Cliente global para superadmin

  useEffect(() => {
    const authData = getAuth();
    if (!authData) {
      router.push('/login');
      return;
    }
    
    // Permitir acceso a superadmin, admin y client (validador)
    if (authData.role !== 'superadmin' && authData.role !== 'admin' && authData.role !== 'client') {
      router.push('/dashboard');
      return;
    }
    
    setAuth(authData);
  }, [router]);

  // Construir endpoint con filtros
  const endpoint = useMemo(() => {
    if (!auth) return '/user';
    
    const filter: Record<string, any> = {};
    
    // Si es admin o client, filtrar por su cliente
    if ((auth.role === 'admin' || auth.role === 'client') && auth.client) {
      filter['client.id'] = { $eq: auth.client.id };
    }
    
    // Si es superadmin y hay un cliente global seleccionado, filtrar por ese cliente
    if (auth.role === 'superadmin' && selectedClient) {
      filter['client.id'] = { $eq: selectedClient.id };
    }
    // Si es superadmin sin cliente global, no aplicar filtro (todos los usuarios)
    
    const queryString = buildCrudQuery({
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });
    
    return `/user${queryString ? `?${queryString}` : ''}`;
  }, [auth, selectedClient]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setChangePasswordModalOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const columns: TableColumn<User>[] = [
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
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'phoneNumber',
      label: 'Teléfono',
      sortable: true,
    },
    ...(auth?.role === 'superadmin'
      ? [
          {
            key: 'client.name',
            label: 'Cliente',
            sortable: true,
            render: (value, row) => {
              if (!row.client) {
                return <span className="text-gray-400 dark:text-gray-500">-</span>;
              }
              return <span>{row.client.name || '-'}</span>;
            },
          } as TableColumn<User>,
        ]
      : []),
    {
      key: 'tickets',
      label: 'Tickets Comprados',
      sortable: false,
      render: (value, row) => {
        const ticketCount = row.tickets?.length || 0;
        return (
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
            {ticketCount}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (value, row) => (
        <ActionsMenu
          onEdit={() => handleEdit(row)}
          showEdit={true}
          customActions={[
            {
              label: 'Cambiar Contraseña',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              ),
              onClick: () => handleChangePassword(row),
              className: 'text-orange-600 dark:text-orange-400',
            },
          ]}
        />
      ),
    },
  ];

  if (!auth) {
    return null;
  }

  const showSidebar = auth && (auth.role === 'superadmin' || auth.role === 'admin' || auth.role === 'client');

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
          title="Usuarios"
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle={!!showSidebar}
        />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header con título */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Lista de Usuarios
              </h2>
            </div>

            <Table
              key={refreshKey}
              endpoint={endpoint}
              columns={columns}
              pageSize={10}
              searchFields={['name', 'email', 'phoneNumber']}
            />
          </div>

          {/* Modal de Editar */}
          <UserModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSuccess={handleSuccess}
          />

          {/* Modal de Cambiar Contraseña */}
          <ChangeUserPasswordModal
            isOpen={changePasswordModalOpen}
            onClose={() => {
              setChangePasswordModalOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSuccess={handleSuccess}
          />
        </main>
      </div>
    </div>
  );
}

