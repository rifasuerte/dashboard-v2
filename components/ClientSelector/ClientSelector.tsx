'use client';

import { useState, useEffect, useRef } from 'react';
import { getClientsList } from '@/lib/api/clients';
import { useClientFilter } from '@/contexts/ClientFilterContext';
import type { Client } from '@/lib/utils/auth';

interface ClientSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientSelector({ isOpen, onClose }: ClientSelectorProps) {
  const { selectedClientId, setSelectedClient } = useClientFilter();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 30;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar clientes
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadClients = async () => {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      try {
        const response = await getClientsList({
          page,
          limit: pageSize,
          sort: 'name,ASC',
          search: search || undefined,
        });
        
        if (!cancelled) {
          if (page === 1) {
            setClients(response.data || []);
          } else {
            setClients((prev) => [...prev, ...(response.data || [])]);
          }
          setTotal(response.total || 0);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error al cargar clientes:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    loadClients();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, page, search]);

  // Resetear búsqueda cuando se abre
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setPage(1);
    }
  }, [isOpen]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    onClose();
  };

  const handleClearFilter = () => {
    setSelectedClient(null);
    onClose();
  };

  const hasMore = page * pageSize < total;

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 flex flex-col"
    >
      {/* Header con búsqueda */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar cliente..."
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          autoFocus
        />
      </div>

      {/* Lista de clientes */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando clientes...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            No se encontraron clientes
          </div>
        ) : (
          <>
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  selectedClientId === client.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {client.name}
              </button>
            ))}
            {hasMore && (
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loadingMore}
                className="w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Cargando...</span>
                  </>
                ) : (
                  'Cargar más'
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer con opción de limpiar */}
      {selectedClientId && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClearFilter}
            className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            Limpiar filtro
          </button>
        </div>
      )}
    </div>
  );
}

