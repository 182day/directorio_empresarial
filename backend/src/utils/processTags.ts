// src/utils/processTags.ts

// Helper para procesar el string de etiquetas enviado por el frontend
export const processEtiquetas = (etiquetas: any): string[] => {
  if (Array.isArray(etiquetas)) return etiquetas;
  if (typeof etiquetas === 'string' && etiquetas.trim() !== '') {
    return etiquetas.split(',').map((t) => t.trim()).filter((t) => t !== '');
  }
  return [];
};