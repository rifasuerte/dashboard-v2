'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuth, clearAuth, updateAuth } from '@/lib/utils/auth';
import { getAdminById } from '@/lib/api/admin';
import { useLoading } from '@/contexts/LoadingContext';
import NavigationSidebar from '@/components/Sidebar/NavigationSidebar';
import AppHeader from '@/components/Header/AppHeader';
import StatsDashboard from '@/components/StatsDashboard/StatsDashboard';
import AdminStatsDashboard from '@/components/AdminStatsDashboard/AdminStatsDashboard';
import type { AuthResponse } from '@/lib/utils/auth';

export default function DashboardPage() {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      showLoading('Cargando dashboard...');
      
      const authData = getAuth();
      if (!authData) {
        hideLoading();
        router.push('/login');
        return;
      }

      try {
        // Si el usuario no es superadmin, obtener información completa del admin
        if (authData.role !== 'superadmin') {
          const adminData = await getAdminById(authData.id);
          
          if (!cancelled) {
            // Actualizar el cache con la información del cliente si existe
            if (adminData.client) {
              updateAuth({
                ...adminData,
                token: authData.token, // Mantener el token original
              });
              setAuth({
                ...adminData,
                token: authData.token,
              });
            } else {
              setAuth(authData);
            }
          }
        } else {
          // Si es superadmin, usar los datos del cache directamente
          if (!cancelled) {
            setAuth(authData);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error al cargar información del admin:', error);
          // Si falla, usar los datos del cache
          setAuth(authData);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          hideLoading();
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (loading || !auth) {
    return null;
  }

  // Mostrar sidebar si es superadmin, admin o client (validador)
  const showSidebar = auth && (auth.role === 'superadmin' || auth.role === 'admin' || auth.role === 'client');

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
          title="RifaSuerte Administración"
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle={!!showSidebar}
        />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {auth.role === 'superadmin' ? (
            <StatsDashboard />
          ) : auth.role === 'admin' || auth.role === 'client' ? (
            <AdminStatsDashboard />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Bienvenido al Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Aquí irán las tablas y componentes del sistema.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

