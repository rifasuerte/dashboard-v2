'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { getAuth, clearAuth } from '@/lib/utils/auth';
import { buildCrudQuery } from '@/lib/utils/crud-query';
import NavigationSidebar from '@/components/Sidebar/NavigationSidebar';
import AppHeader from '@/components/Header/AppHeader';
import Table from '@/components/Table/Table';
import AdminModal from '@/components/AdminModal/AdminModal';
import ChangePasswordModal from '@/components/ChangePasswordModal/ChangePasswordModal';
import ActionsMenu from '@/components/ActionsMenu/ActionsMenu';
import { getRoleLabel } from '@/lib/utils/roles';
import type { AuthResponse } from '@/lib/utils/auth';
import type { TableColumn } from '@/components/Table/Table';

export default function AdministradoresPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AuthResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // Construir endpoint con filtros (usar useMemo para evitar recrear en cada render)
  // Debe estar antes de cualquier return condicional para cumplir con las reglas de Hooks
  const endpoint = useMemo(() => {
    if (!auth) return '/admin';
    
    // Construir objeto de filtros según nestjsx/crud
    const filter: Record<string, any> = {};
    
    // Filtro por cliente del admin (si es admin, siempre filtrar por su cliente)
    if (auth.role === 'admin' && auth.client) {
      filter['client.id'] = { $eq: auth.client.id };
    }
    // Nota: El filtro global de cliente para superadmin se aplica en el componente Table
    
    // Filtro por rol
    if (roleFilter) {
      filter['role'] = { $eq: roleFilter };
    }
    
    // Construir query string usando buildCrudQuery
    const queryString = buildCrudQuery({
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });
    
    return `/admin${queryString ? `?${queryString}` : ''}`;
  }, [auth, roleFilter]);

  const showSidebar = auth && (auth.role === 'superadmin' || auth.role === 'admin');

  const handleCreate = () => {
    setSelectedAdmin(null);
    setCreateModalOpen(true);
  };

  const handleEdit = (admin: AuthResponse) => {
    setSelectedAdmin(admin);
    setEditModalOpen(true);
  };

  const handleChangePassword = (admin: AuthResponse) => {
    setSelectedAdmin(admin);
    setChangePasswordModalOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const columns: TableColumn<AuthResponse>[] = [
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
      key: 'role',
      label: 'Rol',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'superadmin'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
              : value === 'client'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}
        >
          {getRoleLabel(value)}
        </span>
      ),
    },
    {
      key: 'identification',
      label: 'Identificación',
      sortable: true,
    },
    // Columna Cliente solo visible para superadmin
    ...(auth?.role === 'superadmin' ? [{
      key: 'client.name',
      label: 'Cliente',
      sortable: true,
      render: (value: any, row: AuthResponse) => {
        if (!row.client) {
          return <span className="text-gray-400 dark:text-gray-500">-</span>;
        }
        return <span>{row.client.name || '-'}</span>;
      },
    }] : []),
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (value, row) => (
        <ActionsMenu
          onEdit={() => handleEdit(row)}
          onChangePassword={() => handleChangePassword(row)}
        />
      ),
    },
  ];

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
          title="Administradores"
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle={!!showSidebar}
        />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Filtros - Diseño compacto */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700 mb-4 flex flex-wrap items-center gap-3">
            {/* Filtro por Rol */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Rol:
              </label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos</option>
                {auth?.role === 'superadmin' && (
                  <option value="superadmin">{getRoleLabel('superadmin')}</option>
                )}
                <option value="admin">{getRoleLabel('admin')}</option>
                <option value="client">{getRoleLabel('client')}</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header con título y botón crear */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Lista de Administradores
              </h2>
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
                Crear Admin
              </button>
            </div>

            <Table
              key={refreshKey}
              endpoint={endpoint}
              columns={columns}
              pageSize={10}
              searchFields={['name', 'email', 'identification']}
              getRowClassName={(row: AuthResponse) => {
                if (row.role === 'client') {
                  return 'bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500';
                } else if (row.role === 'admin') {
                  return 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500';
                } else if (row.role === 'superadmin') {
                  return 'bg-purple-50 dark:bg-purple-900/10 border-l-4 border-purple-500';
                }
                return '';
              }}
            />
          </div>

          {/* Modales */}
          <AdminModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSuccess={handleSuccess}
            admin={null}
          />
          <AdminModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSuccess={handleSuccess}
            admin={selectedAdmin}
          />
          {selectedAdmin && (
            <ChangePasswordModal
              isOpen={changePasswordModalOpen}
              onClose={() => setChangePasswordModalOpen(false)}
              onSuccess={handleSuccess}
              admin={selectedAdmin}
            />
          )}
        </main>
      </div>
    </div>
  );
}

