'use client';

import { useState, useEffect, useRef } from 'react';
import { getClientsList } from '@/lib/api/clients';
import type { Client } from '@/lib/utils/auth';

interface ClientSelectProps {
  value: number | undefined;
  onChange: (clientId: number | undefined) => void;
  required?: boolean;
  initialClient?: Client; // Cliente inicial para preseleccionar (sin buscar en servidor)
}

export default function ClientSelect({ value, onChange, required = false, initialClient }: ClientSelectProps) {
  const [clients, setClients] = useState<Client[]>(initialClient ? [initialClient] : []);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pageSize = 30;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Obtener el cliente seleccionado (primero buscar en clients, si no está y hay initialClient, usar ese)
  const selectedClient = clients.find((c) => c.id === value) || (value && initialClient && initialClient.id === value ? initialClient : undefined);

  // Cargar clientes solo cuando se abre el dropdown
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
            // Si hay initialClient y está seleccionado, incluirlo en la lista
            const newClients = response.data || [];
            if (initialClient && value === initialClient.id) {
              // Asegurar que el initialClient esté en la lista
              const hasInitial = newClients.some((c) => c.id === initialClient.id);
              if (!hasInitial) {
                newClients.unshift(initialClient);
              }
            }
            setClients(newClients);
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

  // Resetear búsqueda y página cuando se abre
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setPage(1);
      // Enfocar el input de búsqueda
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Cargar más clientes
  const handleLoadMore = () => {
    if (!loadingMore && clients.length < total) {
      setPage((prev) => prev + 1);
    }
  };

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón/Input que muestra el cliente seleccionado */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex items-center justify-between ${
          !value ? 'text-gray-400 dark:text-gray-500' : ''
        }`}
      >
        <span>{selectedClient ? selectedClient.name : 'Seleccionar cliente'}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-hidden flex flex-col">
          {/* Búsqueda */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar cliente..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
            />
          </div>

          {/* Lista de clientes */}
          <div className="overflow-y-auto flex-1">
            {loading && page === 1 ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Cargando clientes...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No se encontraron clientes
              </div>
            ) : (
              <>
                {clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      onChange(client.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      value === client.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {client.name}
                  </button>
                ))}

                {/* Botón "Cargar más" */}
                {!loadingMore && clients.length < total && (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700"
                  >
                    Cargar más ({total - clients.length} restantes)
                  </button>
                )}

                {/* Loading más */}
                {loadingMore && (
                  <div className="p-2 text-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Limpiar selección */}
          {value && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                Limpiar selección
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

