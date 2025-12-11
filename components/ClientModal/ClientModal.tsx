'use client';

import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api/client';
import { useLoading } from '@/contexts/LoadingContext';
import { useAlert } from '@/contexts/AlertContext';
import { fileToBase64, downloadGoogleDriveFileAsBase64 } from '@/lib/utils/google-drive';
import ImageWithGoogleDrive from '@/components/ImageWithGoogleDrive/ImageWithGoogleDrive';
import type { Client } from '@/lib/utils/auth';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client: Client | null; // null para crear, objeto para editar
}

interface CreateClientDto {
  name: string;
  fantasyName: string;
  whatsapp?: string;
  domain: string;
  requiresAuth: boolean;
  getDataFromGoogle?: boolean;
  logoBase64?: string;
  bannerBase64?: string;
  banner2Base64?: string;
  bannerAuthBase64?: string;
  videoBase64?: string;
  videoURL?: string; // Alternativa a videoBase64
  autoadminitrable: boolean;
  instagram?: string; // Instagram en formato @Username
}

export default function ClientModal({ isOpen, onClose, onSuccess, client }: ClientModalProps) {
  const { showLoading, hideLoading } = useLoading();
  const { showAlert } = useAlert();
  const [name, setName] = useState('');
  const [fantasyName, setFantasyName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [domain, setDomain] = useState('');
  const [instagram, setInstagram] = useState('');
  const [requiresAuth, setRequiresAuth] = useState(true);
  const [getDataFromGoogle, setGetDataFromGoogle] = useState(false);
  const [autoadminitrable, setAutoadminitrable] = useState(true);
  
  // Archivos seleccionados
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [banner2File, setBanner2File] = useState<File | null>(null);
  const [bannerAuthFile, setBannerAuthFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  // URLs actuales (para mostrar preview)
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [banner2Preview, setBanner2Preview] = useState<string | null>(null);
  const [bannerAuthPreview, setBannerAuthPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  
  const [fileError, setFileError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const banner2InputRef = useRef<HTMLInputElement>(null);
  const bannerAuthInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!client;

  // Cargar datos del cliente si es modo edición
  useEffect(() => {
    // Limpiar todo primero cuando se abre el modal
    if (isOpen) {
      // Limpiar archivos y previews
      setLogoFile(null);
      setBannerFile(null);
      setBanner2File(null);
      setBannerAuthFile(null);
      setVideoFile(null);
      setLogoPreview(null);
      setBannerPreview(null);
      setBanner2Preview(null);
      setBannerAuthPreview(null);
      setVideoPreview(null);
      setFileError('');
      // Limpiar los inputs de archivo
      if (logoInputRef.current) logoInputRef.current.value = '';
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      if (banner2InputRef.current) banner2InputRef.current.value = '';
      if (bannerAuthInputRef.current) bannerAuthInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
    
    if (isOpen && client) {
      setName(client.name || '');
      setFantasyName(client.fantasyName || '');
      setWhatsapp(client.whatsapp || '');
      setDomain(client.domain || '');
      // Remover @ del instagram si existe para mostrarlo en el input
      setInstagram(client.instagram ? client.instagram.replace(/^@+/, '') : '');
      setRequiresAuth(client.requiresAuth ?? true);
      setGetDataFromGoogle(client.getDataFromGoogle ?? false);
      setAutoadminitrable(client.autoadminitrable ?? true);
      
      // Cargar previews de imágenes/videos existentes
      if (client.logoURL) {
        if (client.logoURL.startsWith('data:')) {
          setLogoPreview(client.logoURL);
        } else {
          // Es un ID de Google Drive, descargarlo
          downloadGoogleDriveFileAsBase64(client.logoURL).then(setLogoPreview).catch(() => {});
        }
      }
      if (client.bannerURL) {
        if (client.bannerURL.startsWith('data:')) {
          setBannerPreview(client.bannerURL);
        } else {
          downloadGoogleDriveFileAsBase64(client.bannerURL).then(setBannerPreview).catch(() => {});
        }
      }
      if (client.banner2URL) {
        if (client.banner2URL.startsWith('data:')) {
          setBanner2Preview(client.banner2URL);
        } else {
          downloadGoogleDriveFileAsBase64(client.banner2URL).then(setBanner2Preview).catch(() => {});
        }
      }
      if (client.bannerAuthURL) {
        if (client.bannerAuthURL.startsWith('data:')) {
          setBannerAuthPreview(client.bannerAuthURL);
        } else {
          downloadGoogleDriveFileAsBase64(client.bannerAuthURL).then(setBannerAuthPreview).catch(() => {});
        }
      }
      if (client.videoURL) {
        if (client.videoURL.startsWith('data:')) {
          setVideoPreview(client.videoURL);
        } else {
          downloadGoogleDriveFileAsBase64(client.videoURL).then(setVideoPreview).catch(() => {});
        }
      }
    } else if (isOpen && !client) {
      // Resetear formulario para crear
      setName('');
      setFantasyName('');
      setWhatsapp('');
      setDomain('');
      setInstagram('');
      setRequiresAuth(true);
      setGetDataFromGoogle(false);
      setAutoadminitrable(true);
      setLogoFile(null);
      setBannerFile(null);
      setBanner2File(null);
      setBannerAuthFile(null);
      setVideoFile(null);
      setLogoPreview(null);
      setBannerPreview(null);
      setBanner2Preview(null);
      setBannerAuthPreview(null);
      setVideoPreview(null);
    }
    
    // Limpiar todo cuando se cierra el modal
    if (!isOpen) {
      setName('');
      setFantasyName('');
      setWhatsapp('');
      setDomain('');
      setInstagram('');
      setRequiresAuth(true);
      setGetDataFromGoogle(false);
      setAutoadminitrable(true);
      setLogoFile(null);
      setBannerFile(null);
      setBanner2File(null);
      setBannerAuthFile(null);
      setVideoFile(null);
      setLogoPreview(null);
      setBannerPreview(null);
      setBanner2Preview(null);
      setBannerAuthPreview(null);
      setVideoPreview(null);
      setFileError('');
      // Limpiar los inputs de archivo
      if (logoInputRef.current) logoInputRef.current.value = '';
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      if (banner2InputRef.current) banner2InputRef.current.value = '';
      if (bannerAuthInputRef.current) bannerAuthInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  }, [isOpen, client]);

  // Generar preview cuando se selecciona un archivo
  useEffect(() => {
    if (logoFile) {
      fileToBase64(logoFile).then(setLogoPreview);
    }
  }, [logoFile]);

  useEffect(() => {
    if (bannerFile) {
      fileToBase64(bannerFile).then(setBannerPreview);
    }
  }, [bannerFile]);

  useEffect(() => {
    if (banner2File) {
      fileToBase64(banner2File).then(setBanner2Preview);
    }
  }, [banner2File]);

  useEffect(() => {
    if (bannerAuthFile) {
      fileToBase64(bannerAuthFile).then(setBannerAuthPreview);
    }
  }, [bannerAuthFile]);

  useEffect(() => {
    if (videoFile) {
      fileToBase64(videoFile).then(setVideoPreview);
    }
  }, [videoFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!name || !fantasyName || !domain) {
      showAlert('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    // Validar tamaño de archivos
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
    const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15 MB

    if (logoFile && logoFile.size > MAX_IMAGE_SIZE) {
      showAlert('El logo no puede exceder 10 MB', 'warning');
      return;
    }
    if (bannerFile && bannerFile.size > MAX_IMAGE_SIZE) {
      showAlert('El banner no puede exceder 10 MB', 'warning');
      return;
    }
    if (banner2File && banner2File.size > MAX_IMAGE_SIZE) {
      showAlert('El banner 2 no puede exceder 10 MB', 'warning');
      return;
    }
    if (bannerAuthFile && bannerAuthFile.size > MAX_IMAGE_SIZE) {
      showAlert('El banner de autenticación no puede exceder 10 MB', 'warning');
      return;
    }
    if (videoFile && videoFile.size > MAX_VIDEO_SIZE) {
      showAlert('El video no puede exceder 15 MB', 'warning');
      return;
    }

    showLoading(isEditMode ? 'Actualizando cliente...' : 'Creando cliente...');

    try {
      const data: CreateClientDto = {
        name,
        fantasyName,
        whatsapp: whatsapp || undefined,
        domain,
        instagram: instagram.trim() ? (instagram.startsWith('@') ? instagram : `@${instagram}`) : undefined,
        requiresAuth,
        getDataFromGoogle: getDataFromGoogle || undefined,
        autoadminitrable,
      };

      // Solo incluir archivos si se seleccionaron nuevos (no reenviar si no cambiaron)
      if (logoFile) {
        data.logoBase64 = await fileToBase64(logoFile);
      }

      if (bannerFile) {
        data.bannerBase64 = await fileToBase64(bannerFile);
      }

      if (banner2File) {
        data.banner2Base64 = await fileToBase64(banner2File);
      }

      if (bannerAuthFile) {
        data.bannerAuthBase64 = await fileToBase64(bannerAuthFile);
      }

      if (videoFile) {
        data.videoBase64 = await fileToBase64(videoFile);
      }

      if (isEditMode && client) {
        // Actualizar
        await apiRequest<Client>(`/client/${client.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        // Crear
        await apiRequest<Client>('/client', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }

      hideLoading();
      onSuccess();
      onClose();
    } catch (err) {
      hideLoading();
      showAlert(err instanceof Error ? err.message : 'Error al guardar el cliente', 'error');
    }
  };

  const renderFileInput = (
    label: string,
    file: File | null,
    preview: string | null,
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void,
    inputRef: React.RefObject<HTMLInputElement | null>,
    accept: string = 'image/*'
  ) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
        <div className="flex items-center gap-4">
          {preview && (
            <div className="relative w-24 h-24 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              {accept.includes('video') ? (
                <video src={preview} className="w-full h-full object-cover" controls />
              ) : (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex-1">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
                  const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15 MB
                  const maxSize = accept.includes('video') ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
                  const maxSizeMB = accept.includes('video') ? 15 : 10;
                  
                  if (selectedFile.size > maxSize) {
                    setFileError(`El archivo "${label}" no puede exceder ${maxSizeMB} MB`);
                    e.target.value = '';
                    // Limpiar el error después de 5 segundos
                    setTimeout(() => setFileError(''), 5000);
                    return;
                  }
                  setFileError(''); // Limpiar error si el archivo es válido
                  setFile(selectedFile);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Editar Cliente' : 'Crear Cliente'}
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {fileError && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{fileError}</span>
                <button
                  type="button"
                  onClick={() => setFileError('')}
                  className="ml-auto p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Fantasía *
                </label>
                <input
                  type="text"
                  value={fantasyName}
                  onChange={(e) => setFantasyName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subdominio *
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+56912345678"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instagram
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Remover @ si el usuario lo agrega manualmente
                    if (value.startsWith('@')) {
                      value = value.substring(1);
                    }
                    setInstagram(value);
                  }}
                  placeholder="Username"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresAuth"
                  checked={requiresAuth}
                  onChange={(e) => setRequiresAuth(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="requiresAuth" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Requiere Auth *
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="getDataFromGoogle"
                  checked={getDataFromGoogle}
                  onChange={(e) => setGetDataFromGoogle(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="getDataFromGoogle" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Obtener datos de Google
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoadminitrable"
                  checked={autoadminitrable}
                  onChange={(e) => setAutoadminitrable(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoadminitrable" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto Administrable *
                </label>
              </div>
            </div>

            {/* Archivos */}
            <div className="grid grid-cols-2 gap-4">
              {renderFileInput('Logo', logoFile, logoPreview, setLogoFile, setLogoPreview, logoInputRef)}
              {renderFileInput('Banner', bannerFile, bannerPreview, setBannerFile, setBannerPreview, bannerInputRef)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderFileInput('Banner 2', banner2File, banner2Preview, setBanner2File, setBanner2Preview, banner2InputRef)}
              {renderFileInput('Banner Auth', bannerAuthFile, bannerAuthPreview, setBannerAuthFile, setBannerAuthPreview, bannerAuthInputRef)}
            </div>
            {renderFileInput('Video', videoFile, videoPreview, setVideoFile, setVideoPreview, videoInputRef, 'video/*')}
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
  );
}

