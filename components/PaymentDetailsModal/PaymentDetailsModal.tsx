'use client';

import { useState } from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import { useAlert } from '@/contexts/AlertContext';
import { getAuth } from '@/lib/utils/auth';
import { validatePayment, rejectPayment } from '@/lib/api/payments';
import ZoomableImage from '@/components/ZoomableImage/ZoomableImage';
import type { Payment } from '@/lib/utils/payment';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onSuccess: () => void;
}

export default function PaymentDetailsModal({ isOpen, onClose, payment, onSuccess }: PaymentDetailsModalProps) {
  const { showLoading, hideLoading } = useLoading();
  const { showAlert } = useAlert();
  const auth = getAuth();
  const [showValidateConfirm, setShowValidateConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  if (!isOpen || !payment) return null;

  const isPending = payment.isValidated === 'Pendiente';
  const isApproved = payment.isValidated === 'Aprobado';
  const isSuperadmin = auth?.role === 'superadmin';
  const canReject = isPending || (isApproved && isSuperadmin);

  const handleValidate = async () => {
    if (!payment) return;
    
    showLoading('Validando pago...');
    try {
      await validatePayment(payment.id);
      hideLoading();
      setShowValidateConfirm(false);
      onSuccess();
      onClose();
    } catch (error) {
      hideLoading();
      showAlert(error instanceof Error ? error.message : 'Error al validar el pago', 'error');
    }
  };

  const handleReject = async () => {
    if (!payment) return;
    
    showLoading('Rechazando pago...');
    try {
      await rejectPayment(payment.id);
      hideLoading();
      setShowRejectConfirm(false);
      onSuccess();
      onClose();
    } catch (error) {
      hideLoading();
      showAlert(error instanceof Error ? error.message : 'Error al rechazar el pago', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Detalles del Pago
              </h2>
              <p className="text-blue-100 text-sm mt-1">ID: #{payment.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
          >
            <svg
              className="w-6 h-6 text-white"
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

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-6">
              {/* Estado - Card destacado */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Estado del Pago
                  </h3>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-xl text-base font-semibold ${
                    payment.isValidated === 'Pendiente'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : payment.isValidated === 'Aprobado'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  {payment.isValidated || 'Pendiente'}
                </span>
              </div>

              {/* Método de Pago */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                  Método de Pago
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {payment.method 
                      ? (payment.method.includes('(') 
                          ? payment.method.substring(0, payment.method.indexOf('(')).trim()
                          : payment.method)
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Cliente - Solo para superadmin */}
              {payment.client && isSuperadmin && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Cliente
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nombre</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{payment.client.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nombre Fantasía</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{payment.client.fantasyName}</p>
                    </div>
                    {payment.client.whatsapp && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">WhatsApp</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{payment.client.whatsapp}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rifa */}
              {payment.raffle && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Rifa
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nombre</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{payment.raffle.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Precio del Ticket</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {parseFloat(payment.raffle.ticketPrice).toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {payment.raffle.ticketCurrency}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              {/* Números de Tickets */}
              {payment.tickets && payment.tickets.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Números de Tickets
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                      {payment.tickets.length}
                    </span>
                  </div>
                  {/* Total a Pagar */}
                  {payment.raffle && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Total a Pagar
                      </p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {(parseFloat(payment.raffle.ticketPrice) * payment.tickets.length).toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {payment.raffle.ticketCurrency}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {payment.tickets.length} ticket{payment.tickets.length > 1 ? 's' : ''} ×{' '}
                        {parseFloat(payment.raffle.ticketPrice).toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {payment.raffle.ticketCurrency}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {payment.tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="px-4 py-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl text-sm font-bold text-blue-700 dark:text-blue-300 shadow-sm"
                      >
                        {String(ticket.ticketNumber).padStart(5, '0')}
                      </div>
                    ))}
                  </div>
                  {payment.user && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        Información del Comprador
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nombre</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{payment.user.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{payment.user.email}</p>
                        </div>
                        {payment.user.phoneNumber && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Teléfono</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{payment.user.phoneNumber}</p>
                          </div>
                        )}
                        {payment.user.identification && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cédula/Identificación</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{payment.user.identification}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Voucher de Compra */}
              {payment.voucher && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Voucher de Compra
                  </h3>
                  <div className="p-4">
                    <ZoomableImage
                      src={payment.voucher}
                      alt="Voucher de compra"
                      className="rounded-lg shadow-md"
                    />
                  </div>
                </div>
              )}

              {/* Fecha de Creación */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                  Fecha de Compra
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {payment.createdAt
                      ? new Date(payment.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          {isPending && (
            <>
              <button
                onClick={() => setShowValidateConfirm(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Validar
              </button>
              <button
                onClick={() => setShowRejectConfirm(true)}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Rechazar
              </button>
            </>
          )}
          {canReject && !isPending && (
            <button
              onClick={() => setShowRejectConfirm(true)}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Rechazar
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Confirmación de Validar */}
      {showValidateConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Confirmar Validación
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas validar este pago?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowValidateConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleValidate}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de Rechazar */}
      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Confirmar Rechazo
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas rechazar este pago?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

