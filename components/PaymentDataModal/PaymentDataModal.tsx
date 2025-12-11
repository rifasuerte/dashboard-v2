'use client';

import { useState, useEffect } from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import { useAlert } from '@/contexts/AlertContext';
import type { PaymentData } from '@/lib/utils/raffle';
import PaymentMethodSelect from '@/components/PaymentMethodSelect/PaymentMethodSelect';
import ImageWithGoogleDrive from '@/components/ImageWithGoogleDrive/ImageWithGoogleDrive';
import { fileToBase64, downloadGoogleDriveFileAsBase64 } from '@/lib/utils/google-drive';
import { createPaymentData, updatePaymentData } from '@/lib/api/raffles';

interface PaymentDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentDataList: PaymentData[];
  onChange: (paymentData: PaymentData[]) => void;
  raffleId: number | null; // ID de la rifa (null si aún no se ha creado)
  onRefresh?: () => void; // Función para recargar los datos de pago desde el servidor
}

export default function PaymentDataModal({ isOpen, onClose, paymentDataList, onChange, raffleId, onRefresh }: PaymentDataModalProps) {
  const { showLoading, hideLoading } = useLoading();
  const { showAlert } = useAlert();
  const [localPaymentData, setLocalPaymentData] = useState<PaymentData[]>(paymentDataList);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<PaymentData>({
    method: '',
    identification: '',
    accountNumber: '',
    phoneNumber: '',
    bank: '',
    accountType: '',
    name: '',
    logoBase64: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState<number | null>(null);
  
  // Métodos que requieren subir logo del banco
  const methodsRequiringLogo = ['Pago Móvil', 'Transferencia Bancaria'];
  const requiresLogoUpload = methodsRequiringLogo.includes(formData.method);

  useEffect(() => {
    if (isOpen) {
      // Cargar datos de pago y descargar logos desde Google Drive si es necesario
      const loadPaymentDataWithLogos = async () => {
        const loadedData = await Promise.all(
          paymentDataList.map(async (pd) => {
            // Si tiene logo y no es base64, descargarlo desde Google Drive
            const logoValue = pd.logo || pd.logoBase64;
            
            if (!logoValue || logoValue.trim() === '') {
              return pd;
            }
            
            const logo = logoValue.trim();
            
            // Si ya es base64, mantenerlo
            if (logo.startsWith('data:')) {
              return { ...pd, logoBase64: logo, logo: pd.logo || undefined };
            }
            
            // Si no es base64, es un ID de Google Drive - descargarlo
            try {
              const base64Logo = await downloadGoogleDriveFileAsBase64(logo);
              return { ...pd, logoBase64: base64Logo, logo: logo }; // Mantener ambos: logoBase64 para mostrar, logo para referencia
            } catch (error) {
              console.error('Error al descargar logo desde Google Drive:', error);
              // Mantener el ID aunque falle la descarga, para que ImageWithGoogleDrive lo intente
              return { ...pd, logoBase64: '', logo: logo };
            }
          })
        );
        setLocalPaymentData(loadedData);
      };
      
      loadPaymentDataWithLogos();
      setEditingIndex(null);
      setFormData({
        method: '',
        identification: '',
        accountNumber: '',
        phoneNumber: '',
        bank: '',
        accountType: '',
        name: '',
        logoBase64: '',
      });
      setLogoFile(null);
      setLogoPreview(null);
      setSaving(false);
    }
  }, [isOpen, paymentDataList]);

  // Manejar cambio de archivo de logo
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (10MB máximo)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showAlert('El archivo es demasiado grande. El tamaño máximo es 10MB.', 'warning');
      return;
    }

    // Validar tipo de archivo (solo imágenes)
    if (!file.type.startsWith('image/')) {
      showAlert('Por favor selecciona un archivo de imagen válido.', 'warning');
      return;
    }

    setLogoFile(file);
    try {
      const base64 = await fileToBase64(file);
      setLogoPreview(base64);
      setFormData({ ...formData, logoBase64: base64 });
    } catch (error) {
      console.error('Error al convertir archivo a base64:', error);
      showAlert('Error al procesar la imagen', 'error');
    }
  };

  const handleAddPaymentData = async () => {
    if (!formData.method.trim()) {
      showAlert('Por favor ingresa un método de pago', 'warning');
      return;
    }

    // Si requiere logo y no hay logo, mostrar error
    if (requiresLogoUpload && !formData.logoBase64) {
      showAlert('Por favor sube el logo del banco', 'warning');
      return;
    }

    // Si no hay raffleId, no se puede crear (la rifa debe existir primero)
    if (!raffleId) {
      showAlert('Debes guardar la rifa primero antes de agregar datos de pago', 'warning');
      return;
    }

    setSaving(true);
    showLoading('Creando datos de pago...');
    try {
      const created = await createPaymentData({
        method: formData.method,
        identification: formData.identification,
        accountNumber: formData.accountNumber,
        phoneNumber: formData.phoneNumber,
        bank: formData.bank,
        accountType: formData.accountType,
        name: formData.name,
        raffle: raffleId,
        logo: formData.logoBase64 || undefined,
      });

      // Recargar datos desde el servidor si hay función de refresh
      if (onRefresh) {
        await onRefresh();
      } else {
        // Si no hay refresh, agregar manualmente
        const updated = [...localPaymentData, created];
        setLocalPaymentData(updated);
        onChange(updated);
      }

      // Reset
      setFormData({
        method: '',
        identification: '',
        accountNumber: '',
        phoneNumber: '',
        bank: '',
        accountType: '',
        name: '',
        logoBase64: '',
      });
      setLogoFile(null);
      setLogoPreview(null);
    } catch (error) {
      console.error('Error al crear datos de pago:', error);
      showAlert(error instanceof Error ? error.message : 'Error al crear los datos de pago', 'error');
    } finally {
      hideLoading();
      setSaving(false);
    }
  };

  const handleEditPaymentData = async (index: number) => {
    const paymentData = localPaymentData[index];
    setEditingIndex(index);
    setLogoFile(null);
    
    // Si tiene logo, verificar si es un ID de Google Drive o base64
    const logoValue = paymentData.logoBase64 || paymentData.logo;
    
    if (logoValue && logoValue.trim() !== '') {
      const logo = logoValue.trim();
      
      // Si es base64 (empieza con data:), usar directamente
      if (logo.startsWith('data:')) {
        setLogoPreview(logo);
        setFormData({ ...paymentData, logoBase64: logo });
      } else {
        // Si no es base64, asumimos que es un ID de Google Drive
        setLoadingLogo(true);
        try {
          const base64Logo = await downloadGoogleDriveFileAsBase64(logo);
          setLogoPreview(base64Logo);
          setFormData({ ...paymentData, logoBase64: base64Logo, logo: logo });
        } catch (error) {
          console.error('Error al descargar logo desde Google Drive:', error);
          showAlert('Error al cargar el logo desde Google Drive', 'error');
          setLogoPreview(null);
          setFormData({ ...paymentData, logoBase64: '', logo: logo });
        } finally {
          setLoadingLogo(false);
        }
      }
    } else {
      setLogoPreview(null);
      setFormData({ ...paymentData });
    }
  };

  const handleUpdatePaymentData = async () => {
    if (editingIndex === null || !formData.method.trim()) {
      return;
    }

    // Si requiere logo y no hay logo, mostrar error
    if (requiresLogoUpload && !formData.logoBase64) {
      showAlert('Por favor sube el logo del banco', 'warning');
      return;
    }

    const paymentDataToUpdate = localPaymentData[editingIndex];
    if (!paymentDataToUpdate.id) {
      showAlert('Error: No se puede actualizar un dato de pago sin ID', 'error');
      return;
    }

    setSaving(true);
    showLoading('Actualizando datos de pago...');
    try {
      const updated = await updatePaymentData(paymentDataToUpdate.id, {
        method: formData.method,
        identification: formData.identification,
        accountNumber: formData.accountNumber,
        phoneNumber: formData.phoneNumber,
        bank: formData.bank,
        accountType: formData.accountType,
        name: formData.name,
        logo: formData.logoBase64 || undefined,
      });

      // Recargar datos desde el servidor si hay función de refresh
      if (onRefresh) {
        await onRefresh();
      } else {
        // Si no hay refresh, actualizar manualmente
        const updatedList = [...localPaymentData];
        updatedList[editingIndex] = updated;
        setLocalPaymentData(updatedList);
        onChange(updatedList);
      }

      // Reset
      setEditingIndex(null);
      setFormData({
        method: '',
        identification: '',
        accountNumber: '',
        phoneNumber: '',
        bank: '',
        accountType: '',
        name: '',
        logoBase64: '',
      });
      setLogoFile(null);
      setLogoPreview(null);
    } catch (error) {
      console.error('Error al actualizar datos de pago:', error);
      showAlert(error instanceof Error ? error.message : 'Error al actualizar los datos de pago', 'error');
    } finally {
      hideLoading();
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (index: number) => {
    const paymentData = localPaymentData[index];
    
    if (!paymentData.id) {
      showAlert('Debes guardar los datos de pago primero antes de cambiar la visibilidad', 'warning');
      return;
    }
    
    const newVisible = !(paymentData.visible ?? true); // Por defecto es visible si no está definido
    
    setTogglingVisibility(index);
    showLoading('Actualizando visibilidad...');
    
    try {
      const updated = await updatePaymentData(paymentData.id, { visible: newVisible });
      
      if (onRefresh) {
        await onRefresh();
      } else {
        const updatedList = [...localPaymentData];
        updatedList[index] = { ...updatedList[index], visible: newVisible };
        setLocalPaymentData(updatedList);
        onChange(updatedList);
      }
    } catch (error) {
      console.error('Error al actualizar visibilidad:', error);
      showAlert(error instanceof Error ? error.message : 'Error al actualizar la visibilidad', 'error');
    } finally {
      hideLoading();
      setTogglingVisibility(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setFormData({
      method: '',
      identification: '',
      accountNumber: '',
      phoneNumber: '',
      bank: '',
      accountType: '',
      name: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Datos de Pago
            </h3>
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

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Lista de datos de pago */}
          <div className="space-y-3 mb-6">
            {localPaymentData.map((paymentData, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex items-center gap-3">
                    {(() => {
                      // Priorizar logoBase64 si existe, sino usar logo (ID de Google Drive)
                      const logoValue = paymentData.logoBase64 || paymentData.logo;
                      
                      if (!logoValue || logoValue.trim() === '') {
                        return null;
                      }
                      
                      // Si es base64, usar directamente
                      if (logoValue.startsWith('data:')) {
                        return (
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-2 shadow-sm border border-gray-200 dark:border-gray-600">
                            <img 
                              src={logoValue} 
                              alt={paymentData.method} 
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        );
                      }
                      
                      // Si es un ID de Google Drive, usar ImageWithGoogleDrive
                      return (
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-2 shadow-sm border border-gray-200 dark:border-gray-600">
                          <ImageWithGoogleDrive
                            src={logoValue}
                            alt={paymentData.method}
                            className="w-full h-full object-contain"
                            fallback={null}
                          />
                        </div>
                      );
                    })()}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{paymentData.method}</p>
                      {paymentData.bank && <p className="text-sm text-gray-600 dark:text-gray-400">{paymentData.bank}</p>}
                      {paymentData.accountNumber && <p className="text-sm text-gray-600 dark:text-gray-400">Cuenta: {paymentData.accountNumber}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPaymentData(index)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleVisibility(index)}
                      disabled={togglingVisibility === index || !paymentData.id}
                      className={`p-2 rounded-lg transition-colors ${
                        paymentData.visible !== false
                          ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={
                        togglingVisibility === index
                          ? 'Actualizando...'
                          : paymentData.visible !== false
                          ? 'Ocultar método de pago'
                          : 'Mostrar método de pago'
                      }
                    >
                      {togglingVisibility === index ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : paymentData.visible !== false ? (
                        // Ojo abierto (visible)
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        // Ojo tachado (oculto)
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Formulario para agregar/editar datos de pago */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {editingIndex !== null ? 'Editar Datos de Pago' : 'Agregar Nuevos Datos de Pago'}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Método de Pago *
                </label>
                <PaymentMethodSelect
                  value={formData.method}
                  onChange={(method, logoBase64) => {
                    // Si el método requiere logo upload, limpiar el logoBase64 predefinido
                    if (methodsRequiringLogo.includes(method)) {
                      setFormData({ ...formData, method, logoBase64: '' });
                      setLogoPreview(null);
                      setLogoFile(null);
                    } else {
                      // Para otros métodos, usar el logo predefinido
                      setFormData({ ...formData, method, logoBase64: logoBase64 || '' });
                      setLogoPreview(logoBase64 || null);
                      setLogoFile(null);
                    }
                  }}
                  required
                />
              </div>
              
              {/* Campo para subir logo del banco (solo para Pago Móvil y Transferencia Bancaria) */}
              {requiresLogoUpload && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logo del Banco *
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    {logoPreview && (
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center p-2 shadow-sm border border-gray-200 dark:border-gray-600">
                        <img 
                          src={logoPreview} 
                          alt="Logo del banco" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Banco
                  </label>
                  <input
                    type="text"
                    value={formData.bank || ''}
                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    placeholder="Ej: Banco Nacional"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Cuenta
                  </label>
                  <input
                    type="text"
                    value={formData.accountType || ''}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    placeholder="Ej: Ahorros"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número de Cuenta
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber || ''}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="Ej: 1234567890"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="Ej: +5491123456789"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Identificación
                  </label>
                  <input
                    type="text"
                    value={formData.identification || ''}
                    onChange={(e) => setFormData({ ...formData, identification: e.target.value })}
                    placeholder="Ej: 12345678"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Dueño
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Juan Perez"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {editingIndex !== null ? (
                  <>
                    <button
                      type="button"
                      onClick={handleUpdatePaymentData}
                      disabled={saving || loadingLogo}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    >
                      {saving ? 'Guardando...' : 'Actualizar'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving || loadingLogo}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddPaymentData}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    {saving ? 'Guardando...' : 'Agregar Datos de Pago'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

