// src/helpers/documentHelper.ts
import api from '../api/axios';
import { toast } from 'sonner';

/**
 * Obtiene un documento de la API con autenticación y lo abre en una nueva pestaña del navegador.
 * @param filename Nombre del archivo a descargar/visualizar
 */
export const viewCompanyDocument = async (filename?: string): Promise<void> => {
  if (!filename) {
    toast.error('El nombre del archivo no es válido.');
    return;
  }

  try {
    const response = await api.get(`/companies/documents/file/${filename}`, {
      responseType: 'blob'
    });

    const headerContentType = response.headers['content-type'];
    const contentType = typeof headerContentType === 'string' 
      ? headerContentType 
      : 'application/pdf';

    const blob = new Blob([response.data], { type: contentType });
    const fileURL = URL.createObjectURL(blob);

    window.open(fileURL, '_blank');

    setTimeout(() => {
      URL.revokeObjectURL(fileURL);
    }, 10000);
  } catch (error: any) {
    console.error('Error al visualizar el documento:', error);
    toast.error('No se pudo abrir el documento. Verifica tus permisos o inténtalo más tarde.');
  }
};