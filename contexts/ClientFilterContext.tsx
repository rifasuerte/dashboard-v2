'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Client } from '@/lib/utils/auth';

interface ClientFilterContextType {
  selectedClientId: number | null;
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  setSelectedClientId: (clientId: number | null) => void;
}

const ClientFilterContext = createContext<ClientFilterContextType | undefined>(undefined);

export function ClientFilterProvider({ children }: { children: ReactNode }) {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleSetSelectedClient = (client: Client | null) => {
    setSelectedClient(client);
    setSelectedClientId(client?.id || null);
  };

  const handleSetSelectedClientId = (clientId: number | null) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setSelectedClient(null);
    }
  };

  return (
    <ClientFilterContext.Provider
      value={{
        selectedClientId,
        selectedClient,
        setSelectedClient: handleSetSelectedClient,
        setSelectedClientId: handleSetSelectedClientId,
      }}
    >
      {children}
    </ClientFilterContext.Provider>
  );
}

export function useClientFilter() {
  const context = useContext(ClientFilterContext);
  if (context === undefined) {
    throw new Error('useClientFilter must be used within a ClientFilterProvider');
  }
  return context;
}

