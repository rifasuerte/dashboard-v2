'use client';

import { useState, useEffect } from 'react';
import { downloadGoogleDriveFileAsBase64 } from '@/lib/utils/google-drive';

interface ImageWithGoogleDriveProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  width?: number;
  height?: number;
}

/**
 * Componente que detecta si la imagen es un ID de Google Drive o base64
 * y la carga apropiadamente
 */
export default function ImageWithGoogleDrive({ 
  src, 
  alt, 
  className = '', 
  fallback,
  width,
  height
}: ImageWithGoogleDriveProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Resetear estado inmediatamente cuando cambia src
    setImageSrc(null);
    setLoading(true);
    setError(false);

    if (!src) {
      setImageSrc(null);
      setLoading(false);
      return;
    }

    // Si es base64 (data:image), usar directamente
    if (src.startsWith('data:image') || src.startsWith('data:video')) {
      setImageSrc(src);
      setLoading(false);
      setError(false);
      return;
    }

    // Si no es base64, asumimos que es un ID de Google Drive
    let cancelled = false;
    
    downloadGoogleDriveFileAsBase64(src)
      .then((blobUrl) => {
        if (!cancelled) {
          setImageSrc(blobUrl);
          setLoading(false);
          setError(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
          setImageSrc(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src) {
    return fallback || null;
  }

  if (error) {
    return fallback || (
      <div className={`flex items-center justify-center rounded bg-gray-200 text-gray-400 ${className}`}>
        <span className="text-xs">Sin imagen</span>
      </div>
    );
  }

  if (loading || !imageSrc) {
    return (
      <div className={`flex items-center justify-center rounded bg-gray-200 text-gray-400 ${className}`}>
        <span className="text-xs">Cargando...</span>
      </div>
    );
  }

  if (imageSrc.startsWith('data:video')) {
    return (
      <video
        src={imageSrc}
        className={className}
        width={width}
        height={height}
        controls
        style={{ display: 'block' }}
      />
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      style={{ display: 'block' }}
      crossOrigin="anonymous"
      onError={() => {
        setError(true);
        setImageSrc(null);
      }}
    />
  );
}

