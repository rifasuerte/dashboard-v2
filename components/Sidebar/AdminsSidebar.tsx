'use client';

import { useState, useEffect } from 'react';
import { getAdminsList } from '@/lib/api/admin';
import { getAuth } from '@/lib/utils/auth';
import { buildCrudQuery, buildSortParam } from '@/lib/utils/crud-query';
import { useLoading } from '@/contexts/LoadingContext';
import type { AuthResponse } from '@/lib/utils/auth';
import type { AdminsListResponse } from '@/lib/api/admin';

interface AdminsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminsSidebar({ isOpen, onClose }: AdminsSidebarProps) {
  const { showLoading, hideLoading } = useLoading();
  const [admins, setAdmins] = useState<AuthResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const pageSize = 10;

  const auth = getAuth();

  // Fetch data
  useEffect(() => {
    if (!isOpen || !auth) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      showLoading('Cargando administradores...');
      
      try {
        // Construir filtro: si es admin (no superadmin), filtrar por su cliente
        const filter: Record<string, any> | undefined = 
          auth.role === 'admin' && auth.client
            ? { 'client.id': { $eq: auth.client.id } }
            : undefined;

        const response = await getAdminsList({
          page,
          limit: pageSize,
          search: search || undefined,
          sort: sortField ? buildSortParam(sortField, sortOrder) : undefined,
          filter,
        });
        
        setAdmins(response.data || []);
        setTotal(response.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar administradores');
      } finally {
        setLoading(false);
        hideLoading();
      }
    };

    fetchData();
  }, [isOpen, page, search, sortField, sortOrder, auth, showLoading, hideLoading]);

  // Manejar ordenamiento
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortOrder('ASC');
    }
  };

  // Renderizar header de columna
  const renderHeader = (label: string, field: string) => {
    const isSorted = sortField === field;
    
    return (
      <th
        className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700`}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {isSorted && (
            <span className="text-blue-600 dark:text-blue-400">
              {sortOrder === 'ASC' ? '↑' : '↓'}
            </span>
          )}
        </div>
      </th>
    );
  };

  const pageCount = Math.ceil(total / pageSize);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-full lg:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Administradores
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-600 dark:text-gray-400"
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

          {/* Búsqueda */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar administradores..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                    <tr>
                      {renderHeader('Nombre', 'name')}
                      {renderHeader('Email', 'email')}
                      {renderHeader('Rol', 'role')}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {admins.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-4 text-center text-gray-500 dark:text-gray-400"
                        >
                          No hay administradores disponibles
                        </td>
                      </tr>
                    ) : (
                      admins.map((admin) => (
                        <tr
                          key={admin.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {admin.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {admin.email}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                admin.role === 'superadmin'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              }`}
                            >
                              {admin.role}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paginación */}
          {!loading && !error && admins.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, total)} de {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ‹
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  {page} / {pageCount}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

