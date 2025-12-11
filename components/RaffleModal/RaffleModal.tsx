'use client';

import { useState, useEffect } from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import { useAlert } from '@/contexts/AlertContext';
import { getAuth, type Client } from '@/lib/utils/auth';
import { createRaffle, updateRaffle, getRaffleById } from '@/lib/api/raffles';
import { prizesToString, parsePrizeString } from '@/lib/utils/raffle';
import ClientSelect from '@/components/ClientSelect/ClientSelect';
import CurrencySelect from '@/components/CurrencySelect/CurrencySelect';
import PrizesModal from '@/components/PrizesModal/PrizesModal';
import PaymentDataModal from '@/components/PaymentDataModal/PaymentDataModal';
import type { Raffle, Prize, PaymentData, CreateRaffleDto } from '@/lib/utils/raffle';

interface RaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  raffle: Raffle | null; // null para crear, objeto para editar
}

export default function RaffleModal({ isOpen, onClose, onSuccess, raffle }: RaffleModalProps) {
  const { showLoading, hideLoading } = useLoading();
  const { showAlert } = useAlert();
  const auth = getAuth();
  const [name, setName] = useState('');
  const [extra, setExtra] = useState('');
  const [selectNumber, setSelectNumber] = useState(true);
  const [winningBySystem, setWinningBySystem] = useState(true);
  const [ticketLimit, setTicketLimit] = useState(100);
  const [minTickets, setMinTickets] = useState(1);
  const [date, setDate] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [ticketCurrency, setTicketCurrency] = useState('Bs.');
  const [numberOfWinners, setNumberOfWinners] = useState(1);
  const [clientId, setClientId] = useState<number | undefined>(undefined);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [paymentDataList, setPaymentDataList] = useState<PaymentData[]>([]);
  const [prizesModalOpen, setPrizesModalOpen] = useState(false);
  const [paymentDataModalOpen, setPaymentDataModalOpen] = useState(false);
  const [currentRaffleId, setCurrentRaffleId] = useState<number | null>(null);

  const isEditMode = !!raffle;
  const isSuperadmin = auth?.role === 'superadmin';

  // Cargar datos de la rifa si es modo edición
  useEffect(() => {
    if (!isOpen) return;
    
    if (raffle) {
      setName(raffle.name || '');
      setExtra(raffle.extra || '');
      setSelectNumber(raffle.selectNumber ?? true);
      setWinningBySystem(raffle.winningBySystem ?? true);
      setTicketLimit(raffle.ticketLimit || 100);
      setMinTickets(raffle.minTickets || 1);
      setDate(raffle.date ? new Date(raffle.date).toISOString().slice(0, 10) : '');
      setTicketPrice(raffle.ticketPrice || '');
      setTicketCurrency(raffle.ticketCurrency || 'Bs.');
      setNumberOfWinners(raffle.numberOfWinners || 1);
      setClientId(raffle.client?.id);
      
      // Parsear premios
      if (raffle.prizes && raffle.prizes.length > 0) {
        const parsedPrizes = raffle.prizes.map(parsePrizeString);
        setPrizes(parsedPrizes);
      } else {
        setPrizes([]);
      }
      
      // Cargar datos de pago si existen
      if (raffle.paymentData && raffle.paymentData.length > 0) {
        // Mapear logo del backend - mantener logo (ID de Google Drive) y también ponerlo en logoBase64 para referencia
        const mappedPaymentData = raffle.paymentData.map(pd => ({
          ...pd,
          logo: pd.logo || pd.logoBase64, // Mantener el logo original (ID de Google Drive o base64)
          logoBase64: pd.logo && !pd.logo.startsWith('data:') ? '' : (pd.logo || pd.logoBase64 || ''), // Solo base64 si ya es base64
        }));
        setPaymentDataList(mappedPaymentData);
      } else {
        setPaymentDataList([]);
      }
      setCurrentRaffleId(raffle.id);
    } else {
      // Resetear formulario para crear
      const currentAuth = getAuth();
      setName('');
      setExtra('');
      setSelectNumber(true);
      setWinningBySystem(true);
      // roulette siempre será false, no se inicializa
      setTicketLimit(100);
      setMinTickets(1);
      setDate('');
      setTicketPrice('');
      setTicketCurrency('Bs.');
      setNumberOfWinners(1);
      setClientId(isSuperadmin ? undefined : currentAuth?.client?.id);
      setPrizes([]);
      setPaymentDataList([]);
      setCurrentRaffleId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, raffle?.id]); // Solo cuando cambia isOpen o el ID de la rifa

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // No permitir editar si la rifa está cerrada
    if (isEditMode && raffle && !raffle.isActive) {
      showAlert('No se puede editar una rifa cerrada', 'error');
      return;
    }

    // Validaciones
    if (!name || !extra || !date || !ticketPrice || !clientId) {
      showAlert('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    if (prizes.length === 0) {
      showAlert('Debes agregar al menos un premio', 'warning');
      return;
    }

    if (numberOfWinners !== prizes.length) {
      showAlert(`El número de ganadores (${numberOfWinners}) debe coincidir con el número de premios (${prizes.length})`, 'warning');
      return;
    }

    showLoading(isEditMode ? 'Actualizando rifa...' : 'Creando rifa...');

    try {
      // Obtener premios originales si es edición
      const originalPrizes = raffle?.prizes ? raffle.prizes.map(parsePrizeString) : undefined;
      
      const data: CreateRaffleDto = {
        name,
        extra,
        selectNumber,
        winningBySystem,
        roulette: false, // Siempre false
        ticketLimit,
        minTickets,
        date: date ? new Date(date + 'T00:00:00').toISOString() : new Date().toISOString(),
        ticketPrice,
        ticketCurrency,
        numberOfWinners,
        prizes: prizesToString(prizes, isEditMode, originalPrizes),
        client: clientId!,
      };

      let createdRaffle: Raffle;
      if (isEditMode && raffle) {
        // Actualizar
        createdRaffle = await updateRaffle(raffle.id, data);
        // Los datos de pago ya se gestionan directamente desde el modal
      } else {
        // Crear
        createdRaffle = await createRaffle(data);
        // Los datos de pago se gestionan directamente desde el modal después de crear la rifa
      }

      hideLoading();
      
      // Actualizar el ID de la rifa para que el modal de datos de pago pueda usarlo
      setCurrentRaffleId(createdRaffle.id);
      
      // Recargar la rifa para obtener los datos de pago actualizados
      if (createdRaffle.id) {
        const updatedRaffle = await getRaffleById(createdRaffle.id);
        if (updatedRaffle.paymentData) {
          // Mapear logo del backend - mantener logo (ID de Google Drive) y también ponerlo en logoBase64 para referencia
          const mappedPaymentData = updatedRaffle.paymentData.map(pd => ({
            ...pd,
            logo: pd.logo || pd.logoBase64, // Mantener el logo original (ID de Google Drive o base64)
            logoBase64: pd.logo && !pd.logo.startsWith('data:') ? '' : (pd.logo || pd.logoBase64 || ''), // Solo base64 si ya es base64
          }));
          setPaymentDataList(mappedPaymentData);
        }
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      hideLoading();
      showAlert(err instanceof Error ? err.message : 'Error al guardar la rifa', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 ${prizesModalOpen || paymentDataModalOpen ? 'z-40 pointer-events-none' : 'z-50'} flex items-center justify-center p-4 overflow-y-auto`}>
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col my-8 ${prizesModalOpen || paymentDataModalOpen ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'Editar Rifa' : 'Crear Rifa'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Card de innerCode si existe (solo en modo edición) */}
              {isEditMode && raffle?.innerCode && raffle?.client && (
                <a
                  href={`https://${raffle.client.domain || 'demo'}.rifasuerte.com/rifa/${raffle.innerCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 inline-block bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                        Código Interno
                      </div>
                      <div className="text-lg font-bold text-blue-900 dark:text-blue-100 font-mono">
                        {raffle.innerCode}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>
                </a>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {isSuperadmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cliente *
                    </label>
                    <ClientSelect
                      value={clientId}
                      onChange={setClientId}
                      required
                      initialClient={raffle?.client ? (raffle.client as Client) : undefined}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Información Extra *
                </label>
                <textarea
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Límite de Tickets *
                  </label>
                  <input
                    type="number"
                    value={ticketLimit}
                    onChange={(e) => setTicketLimit(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tickets Mínimos *
                  </label>
                  <input
                    type="number"
                    value={minTickets}
                    onChange={(e) => setMinTickets(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número de Ganadores *
                  </label>
                  <input
                    type="number"
                    value={numberOfWinners}
                    onChange={(e) => setNumberOfWinners(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio del Ticket *
                  </label>
                  <input
                    type="text"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    required
                    placeholder="1500.00"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Moneda del Ticket *
                    </label>
                    <CurrencySelect
                      value={ticketCurrency}
                      onChange={setTicketCurrency}
                      required
                    />
                  </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="selectNumber"
                    checked={selectNumber}
                    onChange={(e) => setSelectNumber(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="selectNumber" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Seleccionar Número
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="winningBySystem"
                    checked={winningBySystem}
                    onChange={(e) => setWinningBySystem(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="winningBySystem" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ganador por Sistema
                  </label>
                </div>
              </div>

              {/* Premios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Premios * ({prizes.length} premio{prizes.length !== 1 ? 's' : ''})
                </label>
                <button
                  type="button"
                  onClick={() => setPrizesModalOpen(true)}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Gestionar Premios
                </button>
                {prizes.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {prizes.map((prize, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{index + 1}.</span>
                        <span>{prize.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Datos de Pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Datos de Pago ({paymentDataList.length} dato{paymentDataList.length !== 1 ? 's' : ''})
                </label>
                <button
                  type="button"
                  onClick={() => setPaymentDataModalOpen(true)}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Gestionar Datos de Pago
                </button>
                {paymentDataList.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {paymentDataList.map((paymentData, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{index + 1}.</span>
                        <span>{paymentData.method}</span>
                        {paymentData.bank && <span className="text-gray-400">- {paymentData.bank}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Botones fijos en el footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                {isEditMode ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modales */}
      <PrizesModal
        isOpen={prizesModalOpen}
        onClose={() => setPrizesModalOpen(false)}
        prizes={prizes}
        onChange={setPrizes}
        originalPrizes={raffle?.prizes ? raffle.prizes.map(parsePrizeString) : undefined}
      />
      <PaymentDataModal
        isOpen={paymentDataModalOpen}
        onClose={() => setPaymentDataModalOpen(false)}
        paymentDataList={paymentDataList}
        onChange={setPaymentDataList}
        raffleId={currentRaffleId || raffle?.id || null}
        onRefresh={async () => {
          // Recargar los datos de pago desde el servidor
          const raffleIdToLoad = currentRaffleId || raffle?.id;
          if (raffleIdToLoad) {
            const updatedRaffle = await getRaffleById(raffleIdToLoad);
            if (updatedRaffle.paymentData) {
              // Mapear logo del backend - mantener logo (ID de Google Drive) y también ponerlo en logoBase64 para referencia
              const mappedPaymentData = updatedRaffle.paymentData.map(pd => ({
                ...pd,
                logo: pd.logo || pd.logoBase64, // Mantener el logo original (ID de Google Drive o base64)
                logoBase64: pd.logo && !pd.logo.startsWith('data:') ? '' : (pd.logo || pd.logoBase64 || ''), // Solo base64 si ya es base64
              }));
              setPaymentDataList(mappedPaymentData);
            }
          }
        }}
      />
    </>
  );
}

