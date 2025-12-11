'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { getAuth } from '@/lib/utils/auth';
import NavigationSidebar from '@/components/Sidebar/NavigationSidebar';
import AppHeader from '@/components/Header/AppHeader';
import Table from '@/components/Table/Table';
import ClientModal from '@/components/ClientModal/ClientModal';
import ImageWithGoogleDrive from '@/components/ImageWithGoogleDrive/ImageWithGoogleDrive';
import ActionsMenu from '@/components/ActionsMenu/ActionsMenu';
import type { Client } from '@/lib/utils/auth';
import type { TableColumn } from '@/components/Table/Table';

export default function ClientesPage() {
  const router = useRouter();
  const [auth, setAuth] = useState(getAuth());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const authData = getAuth();
    if (!authData) {
      router.push('/login');
      return;
    }
    
    // Solo permitir acceso a superadmin
    if (authData.role !== 'superadmin') {
      router.push('/dashboard');
      return;
    }
    
    setAuth(authData);
  }, [router]);

  const handleCreate = () => {
    setSelectedClient(null);
    setCreateModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setEditModalOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const columns: TableColumn<Client>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
    },
    {
      key: 'logoURL',
      label: 'Logo',
      sortable: false,
      render: (value) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-black flex items-center justify-center p-1">
          {value ? (
            <ImageWithGoogleDrive
              src={value}
              alt="Logo"
              className="w-full h-full object-contain"
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-xs text-gray-400">Sin logo</span>
                </div>
              }
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-xs text-gray-400">Sin logo</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
    },
    {
      key: 'domain',
      label: 'Subdominio',
      sortable: true,
    },
    {
      key: 'autoadminitrable',
      label: 'Auto Administrable',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}
        >
          {value ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      key: 'requiresAuth',
      label: 'Requiere Auth',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}
        >
          {value ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (value, row) => (
        <ActionsMenu
          onEdit={() => handleEdit(row)}
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
      <NavigationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <AppHeader
          title="Clientes"
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle={true}
        />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header con título y botón crear */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Lista de Clientes
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
                Crear Cliente
              </button>
            </div>

            <Table
              key={refreshKey}
              endpoint="/client"
              columns={columns}
              pageSize={10}
              searchFields={['name', 'fantasyName', 'domain', 'whatsapp']}
              ignoreClientFilter={true}
            />
          </div>

          {/* Modales */}
          <ClientModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSuccess={handleSuccess}
            client={null}
          />
          <ClientModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSuccess={handleSuccess}
            client={selectedClient}
          />
        </main>
      </div>
    </div>
  );
}

