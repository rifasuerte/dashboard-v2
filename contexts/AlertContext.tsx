'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import AlertModal from '@/components/Alert/AlertModal';

interface AlertContextType {
  showAlert: (message: string, type?: 'error' | 'warning' | 'info' | 'success') => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    message: string;
    type: 'error' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    message: '',
    type: 'error',
  });

  const showAlert = (message: string, type: 'error' | 'warning' | 'info' | 'success' = 'error') => {
    setAlert({
      isOpen: true,
      message,
      type,
    });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal
        isOpen={alert.isOpen}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

