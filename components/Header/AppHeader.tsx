'use client';

import { useState } from 'react';
import { getAuth, clearAuth } from '@/lib/utils/auth';
import { useRouter } from 'next/navigation';
import { useClientFilter } from '@/contexts/ClientFilterContext';
import ClientSelector from '@/components/ClientSelector/ClientSelector';
import type { AuthResponse } from '@/lib/utils/auth';

interface AppHeaderProps {
  title: string;
  onSidebarToggle?: () => void;
  showSidebarToggle?: boolean;
}

export default function AppHeader({ title, onSidebarToggle, showSidebarToggle }: AppHeaderProps) {
  const router = useRouter();
  const auth = getAuth();
  const { selectedClientId, selectedClient } = useClientFilter();
  const [clientSelectorOpen, setClientSelectorOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const isSuperadmin = auth?.role === 'superadmin';

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            {showSidebarToggle && (
              <button
                onClick={onSidebarToggle}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Selector de Cliente (solo para superadmin) */}
            {isSuperadmin && (
              <div className="relative">
                <button
                  onClick={() => setClientSelectorOpen(!clientSelectorOpen)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    selectedClientId
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {selectedClient ? selectedClient.name : 'Filtrar por cliente'}
                </button>
                <ClientSelector
                  isOpen={clientSelectorOpen}
                  onClose={() => setClientSelectorOpen(false)}
                />
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

