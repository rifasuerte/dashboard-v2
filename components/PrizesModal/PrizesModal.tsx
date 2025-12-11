'use client';

import { useState, useEffect, useRef } from 'react';
import { useAlert } from '@/contexts/AlertContext';
import { fileToBase64, downloadGoogleDriveFileAsBase64 } from '@/lib/utils/google-drive';
import ImageWithGoogleDrive from '@/components/ImageWithGoogleDrive/ImageWithGoogleDrive';
import type { Prize } from '@/lib/utils/raffle';

interface PrizesModalProps {
  isOpen: boolean;
  onClose: () => void;
  prizes: Prize[];
  onChange: (prizes: Prize[]) => void;
  originalPrizes?: Prize[]; // Premios originales para detectar cambios
}

export default function PrizesModal({ isOpen, onClose, prizes, onChange, originalPrizes }: PrizesModalProps) {
  const { showAlert } = useAlert();
  const [localPrizes, setLocalPrizes] = useState<Prize[]>(prizes);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeFile, setNewPrizeFile] = useState<File | null>(null);
  const [newPrizePreview, setNewPrizePreview] = useState<string | null>(null);
  const [originalImageWhenEditing, setOriginalImageWhenEditing] = useState<string | undefined>(undefined);
  const [imageChanged, setImageChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar premios locales con los del padre cuando cambian externamente
  useEffect(() => {
    setLocalPrizes(prizes);
  }, [prizes]);

  // Resetear formulario solo cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setEditingIndex(null);
      setNewPrizeName('');
      setNewPrizeFile(null);
      setNewPrizePreview(null);
      setOriginalImageWhenEditing(undefined);
      setImageChanged(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (newPrizeFile) {
      fileToBase64(newPrizeFile).then(setNewPrizePreview);
    }
  }, [newPrizeFile]);

  const handleAddPrize = async () => {
    if (!newPrizeName.trim()) {
      showAlert('Por favor ingresa un nombre para el premio', 'warning');
      return;
    }

    let imageBase64: string | undefined = undefined;
    if (newPrizeFile) {
      imageBase64 = await fileToBase64(newPrizeFile);
    }

    const newPrize: Prize = {
      name: newPrizeName.trim(),
      image: imageBase64,
    };

    const updatedPrizes = [...localPrizes, newPrize];
    setLocalPrizes(updatedPrizes);
    onChange(updatedPrizes);

    // Reset
    setNewPrizeName('');
    setNewPrizeFile(null);
    setNewPrizePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditPrize = async (index: number) => {
    const prize = localPrizes[index];
    setEditingIndex(index);
    setNewPrizeName(prize.name);
    setNewPrizeFile(null);
    setOriginalImageWhenEditing(prize.image); // Guardar imagen original (puede ser ID de Google Drive o base64)
    setImageChanged(false); // Resetear flag de cambio de imagen
    
    // Cargar preview de imagen existente
    if (prize.image) {
      if (prize.image.startsWith('data:')) {
        setNewPrizePreview(prize.image);
      } else {
        // Es un ID de Google Drive, descargarlo para preview
        try {
          const base64 = await downloadGoogleDriveFileAsBase64(prize.image);
          setNewPrizePreview(base64);
        } catch (err) {
          console.error('Error al cargar imagen:', err);
        }
      }
    } else {
      setNewPrizePreview(null);
    }
  };

  const handleUpdatePrize = async () => {
    if (editingIndex === null || !newPrizeName.trim()) {
      return;
    }

    const updatedPrizes = [...localPrizes];
    const prize = updatedPrizes[editingIndex];

    // Si se seleccionó un archivo nuevo, convertir a base64 (imagen cambió)
    if (newPrizeFile) {
      prize.image = await fileToBase64(newPrizeFile);
      setImageChanged(true);
    } else {
      // Si no se cambió la imagen, mantener la existente (puede ser ID de Google Drive o base64)
      // Si la imagen original era un ID de Google Drive, mantenerlo
      prize.image = originalImageWhenEditing;
      setImageChanged(false);
    }

    prize.name = newPrizeName.trim();
    updatedPrizes[editingIndex] = prize;
    setLocalPrizes(updatedPrizes);
    onChange(updatedPrizes);

    // Reset
    setEditingIndex(null);
    setNewPrizeName('');
    setNewPrizeFile(null);
    setNewPrizePreview(null);
    setOriginalImageWhenEditing(undefined);
    setImageChanged(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeletePrize = (index: number) => {
    const updatedPrizes = localPrizes.filter((_, i) => i !== index);
    setLocalPrizes(updatedPrizes);
    onChange(updatedPrizes);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewPrizeName('');
    setNewPrizeFile(null);
    setNewPrizePreview(null);
    setOriginalImageWhenEditing(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              Premios
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
          {/* Lista de premios */}
          <div className="space-y-3 mb-6">
            {localPrizes.map((prize, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="w-16 h-16 rounded-lg border-2 border-white overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                  {prize.image ? (
                    <ImageWithGoogleDrive
                      src={prize.image}
                      alt={prize.name}
                      className="w-full h-full object-contain"
                      fallback={
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-xs text-gray-400">Sin imagen</span>
                        </div>
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-xs text-gray-400">Sin imagen</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{prize.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditPrize(index)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeletePrize(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Formulario para agregar/editar premio */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {editingIndex !== null ? 'Editar Premio' : 'Agregar Nuevo Premio'}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Premio *
                </label>
                <input
                  type="text"
                  value={newPrizeName}
                  onChange={(e) => setNewPrizeName(e.target.value)}
                  placeholder="Ej: Premio 1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagen del Premio
                </label>
                <div className="flex items-center gap-4">
                  {newPrizePreview && (
                    <div className="relative w-20 h-20 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white flex-shrink-0">
                      <img src={newPrizePreview} alt="Preview" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          setNewPrizeFile(null);
                          setNewPrizePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) {
                          const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
                          if (selectedFile.size > MAX_IMAGE_SIZE) {
                            showAlert('La imagen no puede exceder 10 MB', 'warning');
                            e.target.value = '';
                            return;
                          }
                          setNewPrizeFile(selectedFile);
                          setImageChanged(true); // Marcar que la imagen cambió
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {editingIndex !== null ? (
                  <>
                    <button
                      type="button"
                      onClick={handleUpdatePrize}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Actualizar
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddPrize}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Agregar Premio
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

