'use client';

import { useState, useEffect, useRef } from 'react';
import { PAYMENT_METHODS, getPaymentMethodLogo } from '@/lib/constants/payment-methods';

interface PaymentMethodSelectProps {
  value: string;
  onChange: (method: string, logoBase64?: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export default function PaymentMethodSelect({ value, onChange, required = false, disabled = false }: PaymentMethodSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar métodos según la búsqueda
  const filteredMethods = PAYMENT_METHODS.filter((method) =>
    method.name.toLowerCase().includes(search.toLowerCase())
  );
  
  // Obtener el método seleccionado
  const selectedMethod = PAYMENT_METHODS.find(m => m.name === value);
  const selectedLogo = selectedMethod?.logoBase64 && selectedMethod.logoBase64.trim() !== '' 
    ? (selectedMethod.logoBase64.startsWith('data:') 
        ? selectedMethod.logoBase64 
        : `data:image/png;base64,${selectedMethod.logoBase64}`)
    : undefined;

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Focus en el input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSelect = (methodName: string) => {
    const method = PAYMENT_METHODS.find(m => m.name === methodName);
    const logoBase64 = method?.logoBase64 && method.logoBase64.trim() !== ''
      ? (method.logoBase64.startsWith('data:') 
          ? method.logoBase64 
          : `data:image/png;base64,${method.logoBase64}`)
      : undefined;
    onChange(methodName, logoBase64);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between ${
          !value ? 'text-gray-400 dark:text-gray-500' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          {selectedLogo && selectedLogo.trim() !== '' && (
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1.5 shadow-sm border border-gray-200 dark:border-gray-600">
              <img 
                src={selectedLogo} 
                alt={value} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Ocultar imagen si falla al cargar
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <span>{value || 'Seleccionar método de pago'}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Input de búsqueda */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar método de pago..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Lista de métodos */}
          <div className="max-h-48 overflow-y-auto">
            {filteredMethods.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                No se encontraron métodos
              </div>
            ) : (
              filteredMethods.map((method) => (
                <button
                  key={method.name}
                  type="button"
                  onClick={() => handleSelect(method.name)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                    value === method.name
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {(() => {
                    const logo = method.logoBase64 && method.logoBase64.trim() !== ''
                      ? (method.logoBase64.startsWith('data:') 
                          ? method.logoBase64 
                          : `data:image/png;base64,${method.logoBase64}`)
                      : null;
                    return logo ? (
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1 shadow-sm border border-gray-200 dark:border-gray-600">
                        <img 
                          src={logo} 
                          alt={method.name} 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Ocultar imagen si falla al cargar
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : null;
                  })()}
                  <span>{method.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

