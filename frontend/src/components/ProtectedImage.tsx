// src/components/ProtectedImage.tsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';

interface ProtectedImageProps {
  filename: string;
  alt: string;
  className?: string;
}

export const ProtectedImage: React.FC<ProtectedImageProps> = ({ filename, alt, className }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // Petición con Axios (que incluye el token en los headers automáticamente)
        const response = await api.get(`/companies/documents/file/${filename}`, {
          responseType: 'blob',
        });

        if (isMounted) {
          objectUrl = URL.createObjectURL(response.data);
          setImageSrc(objectUrl);
        }
      } catch (err) {
        console.error('Error al cargar la imagen protegida:', err);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (filename) {
      fetchImage();
    }

    // Limpieza de memoria al desmontar el componente o cambiar de archivo
    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [filename]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-28 w-full bg-app-bg animate-pulse rounded-lg text-xs text-app-muted">
        Cargando imagen...
      </div>
    );
  }

  if (error || !imageSrc) {
    return null; // O puedes retornar un placeholder por defecto si lo prefieres
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
    />
  );
};