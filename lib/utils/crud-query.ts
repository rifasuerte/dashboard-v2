/**
 * Utilidades para construir queries según la documentación de nestjsx/crud
 * https://github.com/nestjsx/crud/wiki/
 */

export interface CrudQueryParams {
  page?: number;
  limit?: number;
  sort?: string | string[]; // "field,ASC" o ["field,ASC", "field2,DESC"]
  filter?: Record<string, any>; // { field: { $eq: value } }
  or?: Array<{ field: string; operator: string; value: any }>; // Condiciones OR
  search?: string | Record<string, any>; // Búsqueda global: string (JSON) o objeto para serializar
  fields?: string[]; // Campos a incluir
  join?: string[]; // Relaciones a incluir
}

/**
 * Construye query string para nestjsx/crud
 */
export function buildCrudQuery(params: CrudQueryParams): string {
  const queryParams = new URLSearchParams();

  // Paginación
  if (params.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }

  // Ordenamiento
  if (params.sort) {
    if (Array.isArray(params.sort)) {
      params.sort.forEach((sort) => queryParams.append('sort', sort));
    } else {
      queryParams.append('sort', params.sort);
    }
  }

  // Filtros - formato: filter=field||$operator||value
  if (params.filter) {
    Object.entries(params.filter).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Filtros con operador: { field: { $eq: value } } -> filter=field||$eq||value
        Object.entries(value).forEach(([operator, opValue]) => {
          queryParams.append('filter', `${key}||${operator}||${opValue}`);
        });
      } else {
        // Filtro simple: { field: value } -> filter=field||$eq||value (asume $eq por defecto)
        queryParams.append('filter', `${key}||$eq||${value}`);
      }
    });
  }

  // Condiciones OR - formato: or=field||$operator||value
  if (params.or && params.or.length > 0) {
    params.or.forEach(({ field, operator, value }) => {
      queryParams.append('or', `${field}||${operator}||${value}`);
    });
  }

  // Búsqueda global - formato: s={"field": "value"} o s={"$or": [...]}
  if (params.search) {
    if (typeof params.search === 'string') {
      // Si ya es un string JSON, usarlo directamente
      queryParams.append('s', params.search);
    } else {
      // Si es un objeto, serializarlo a JSON
      queryParams.append('s', JSON.stringify(params.search));
    }
  }

  // Campos a incluir
  if (params.fields && params.fields.length > 0) {
    queryParams.append('fields', params.fields.join(','));
  }

  // Relaciones (joins)
  if (params.join && params.join.length > 0) {
    params.join.forEach((join) => queryParams.append('join', join));
  }

  return queryParams.toString();
}

/**
 * Construye parámetro de ordenamiento
 */
export function buildSortParam(field: string, order: 'ASC' | 'DESC' = 'ASC'): string {
  return `${field},${order}`;
}

/**
 * Construye filtro de igualdad
 */
export function buildEqFilter(field: string, value: any): Record<string, any> {
  return {
    [field]: { $eq: value },
  };
}

/**
 * Construye filtro de búsqueda (LIKE)
 */
export function buildLikeFilter(field: string, value: string): Record<string, any> {
  return {
    [field]: { $cont: value },
  };
}

