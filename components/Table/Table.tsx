'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/lib/api/client';
import { buildCrudQuery, buildSortParam } from '@/lib/utils/crud-query';
import { useLoading } from '@/contexts/LoadingContext';
import { useClientFilter } from '@/contexts/ClientFilterContext';
import { getAuth } from '@/lib/utils/auth';

// Tipos para la configuración de columnas
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

// Props del componente Table
export interface TableProps<T = any> {
  endpoint: string;
  columns: TableColumn<T>[];
  title?: string;
  pageSize?: number;
  searchFields?: string[]; // Campos en los que buscar cuando hay texto en el input de búsqueda
  ignoreClientFilter?: boolean; // Si es true, ignora el filtro global de cliente
}

// Respuesta del backend con formato nestjsx/crud
interface CrudResponse<T> {
  data: T[];
  count: number;
  total: number;
  page: number;
  pageCount: number;
}

export default function Table<T extends Record<string, any>>({
  endpoint,
  columns,
  title,
  pageSize = 10,
  searchFields = [],
  ignoreClientFilter = false,
}: TableProps<T>) {
  const { showLoading, hideLoading } = useLoading();
  const { selectedClientId } = useClientFilter();
  const auth = getAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('id'); // Por defecto ordenar por ID
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC'); // Por defecto descendente (último primero)

  // Construir URL con query params según nestjsx/crud (usar useMemo para evitar recrear)
  const queryUrl = useMemo(() => {
    // Construir filtros
    const filter: Record<string, any> = {};
    
    // Aplicar filtro global de cliente si está seleccionado y el usuario es superadmin
    // Pero solo si no se debe ignorar el filtro (por ejemplo, en la página de clientes)
    if (selectedClientId && auth?.role === 'superadmin' && !ignoreClientFilter) {
      filter['client.id'] = { $eq: selectedClientId };
    }
    
    // Extraer filtros existentes del endpoint si los hay
    const endpointParts = endpoint.split('?');
    const baseEndpoint = endpointParts[0];
    const existingQuery = endpointParts[1] || '';
    const existingParams = new URLSearchParams(existingQuery);
    const existingFilters = existingParams.getAll('filter');
    
    // Construir búsqueda usando SOLO 'search' con $or
    // Cuando hay búsqueda, NO enviar ningún otro filtro
    const requiredJoins = new Set<string>();
    let searchObj: Record<string, any> | undefined = undefined;
    
    if (search && searchFields.length > 0) {
      // Identificar campos anidados y construir joins necesarios
      searchFields.forEach((field) => {
        if (field.includes('.')) {
          // Campo anidado - necesitamos joins
          const parts = field.split('.');
          if (parts.length > 1) {
            requiredJoins.add(parts[0]);
          }
        }
      });
      
      // Construir objeto de búsqueda con $or para todos los campos
      // Para campos numéricos (como ticketNumber), usar $eq en lugar de $contL
      const orConditions = searchFields.map((field) => {
        // Detectar si es un campo numérico (termina en .ticketNumber o es ticketNumber)
        const isNumericField = field.includes('ticketNumber') || field === 'ticketNumber';
        
        if (isNumericField) {
          // Para campos numéricos, intentar convertir el valor de búsqueda a número
          const numericValue = parseInt(search, 10);
          if (!isNaN(numericValue)) {
            return { [field]: { $eq: numericValue } };
          }
          // Si no se puede convertir, omitir este campo de la búsqueda
          return null;
        }
        
        // Para campos de texto, usar $contL (contains, case-insensitive)
        return { [field]: { $contL: search } };
      }).filter((condition) => condition !== null); // Filtrar condiciones nulas
      
      if (orConditions.length > 0) {
        searchObj = { $or: orConditions };
      }
    }

    // Construir query params nuevos
    // IMPORTANTE: Si hay búsqueda, NO enviar ningún otro filtro
    const newQueryParams = buildCrudQuery({
      page,
      limit: pageSize,
      search: searchObj,
      sort: sortField ? buildSortParam(sortField, sortOrder) : undefined,
      // Solo enviar filtros si NO hay búsqueda
      filter: !searchObj && Object.keys(filter).length > 0 ? filter : undefined,
      join: requiredJoins.size > 0 ? Array.from(requiredJoins) : undefined,
    });
    
    // Combinar filtros existentes con los nuevos
    const finalParams = new URLSearchParams(newQueryParams);
    // IMPORTANTE: Si hay búsqueda, NO agregar filtros existentes
    if (!searchObj) {
      existingFilters.forEach((f) => finalParams.append('filter', f));
    }
    
    // Agregar otros parámetros del endpoint original (excepto page, limit, sort, s que ya están en newQueryParams)
    existingParams.forEach((value, key) => {
      if (!['filter', 'page', 'limit', 'sort', 's', 'join'].includes(key)) {
        finalParams.append(key, value);
      }
    });
    
    const finalQuery = finalParams.toString();
    
    // DEBUG: Mostrar el JSON de búsqueda y la URL completa
    if (searchObj) {
      const searchJsonString = JSON.stringify(searchObj);
      console.log('🔍 JSON de búsqueda enviado (s):', searchJsonString);
      console.log('🔍 JSON formateado:', JSON.stringify(searchObj, null, 2));
      console.log('🔗 Joins necesarios:', Array.from(requiredJoins));
      console.log('🌐 URL completa:', `${baseEndpoint}?${finalQuery}`);
      console.log('📋 Parámetros individuales:');
      finalParams.forEach((value, key) => {
        console.log(`   ${key}: ${value}`);
      });
    }
    return `${baseEndpoint}?${finalQuery}`;
  }, [page, pageSize, search, sortField, sortOrder, endpoint, selectedClientId, auth]);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      showLoading('Cargando datos...');
      
      try {
        const response = await apiRequest<CrudResponse<T>>(queryUrl);
        
        if (!cancelled) {
          setData(response.data || []);
          setTotal(response.total || 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar datos');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          hideLoading();
        }
      }
    };

    fetchData();
    
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryUrl]);

  // Manejar ordenamiento
  const handleSort = (columnKey: string) => {
    if (sortField === columnKey) {
      // Cambiar orden si es la misma columna
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // Nueva columna, orden ascendente por defecto
      setSortField(columnKey);
      setSortOrder('ASC');
    }
  };

  // Renderizar header de columna
  const renderHeader = (column: TableColumn<T>) => {
    const isSorted = sortField === column.key;
    const canSort = column.sortable !== false;

    return (
      <th
        key={column.key}
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
          column.key === 'name' || column.key === 'client.name' || column.key === 'raffle.name'
            ? 'max-w-xs' 
            : ''
        } ${
          canSort ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
        }`}
        onClick={() => canSort && handleSort(column.key)}
      >
        <div className="flex items-center gap-2">
          <span>{column.label}</span>
          {canSort && isSorted && (
            <span className="text-blue-600 dark:text-blue-400">
              {sortOrder === 'ASC' ? '↑' : '↓'}
            </span>
          )}
        </div>
      </th>
    );
  };

  // Renderizar celda
  const renderCell = (column: TableColumn<T>, row: T) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    return <span>{value ?? '-'}</span>;
  };

  const pageCount = Math.ceil(total / pageSize);

  return (
    <div className="overflow-hidden">
      {/* Búsqueda */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Resetear a primera página al buscar
              }}
              placeholder="Buscar..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
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
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>{columns.map(renderHeader)}</tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 text-sm text-gray-900 dark:text-gray-100 ${
                          column.key === 'name' || column.key === 'client.name' || column.key === 'raffle.name'
                            ? 'max-w-xs break-words' 
                            : column.key === 'tickets'
                            ? ''
                            : 'whitespace-nowrap'
                        }`}
                      >
                        {renderCell(column, row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {!loading && !error && data.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, total)} de {total} resultados
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
              Página {page} de {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

