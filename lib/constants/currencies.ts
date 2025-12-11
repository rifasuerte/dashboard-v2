/**
 * Lista de monedas disponibles (más comunes)
 * Esta lista se usa en CurrencySelect y en los filtros de tickets
 */
export interface Currency {
  code: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'Bs.', name: 'Bolívares' },
  { code: 'ARS', name: 'Pesos Argentinos' },
  { code: 'COP', name: 'Pesos Colombianos' },
  { code: 'CLP', name: 'Pesos Chilenos' },
  { code: 'USD', name: 'Dólares Estadounidenses' },
  { code: 'EUR', name: 'Euros' },
  { code: 'MXN', name: 'Pesos Mexicanos' },
  { code: 'BRL', name: 'Reales Brasileños' },
  { code: 'PEN', name: 'Soles Peruanos' },
];

