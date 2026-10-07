// src/utils/matchers/apoyosMatcher.ts
import { OPCIONES_APOYOS } from './data/companyCatalog';

/**
 * Normaliza y compara los apoyos recibidos desde el Excel contra OPCIONES_APOYOS.
 * - Detecta coincidencias exactas con las opciones del catálogo (incluso si tienen comas).
 * - Extrae el residuo que no coincida para asignarlo a 'Otro especifique' y 'otroEspecifique'.
 */
export const parseApoyosYNecesidades = (rawVal: any) => {
  if (!rawVal) {
    return {
      tipos: [],
      otroEspecifique: ''
    };
  }

  let textToProcess = rawVal.toString().trim().replace(/\s+/g, ' ');
  const tiposSet = new Set<string>();

  // Filtramos 'Otro especifique' para buscar solo las opciones reales
  const opcionesConocidas = OPCIONES_APOYOS.filter(
    (op: string) => op.toLowerCase() !== 'otro especifique'
  );

  // Ordenamos de mayor a menor longitud para evitar falsas coincidencias parciales
  opcionesConocidas.sort((a: string, b: string) => b.length - a.length);

  for (const opcion of opcionesConocidas) {
    if (textToProcess.toLowerCase().includes(opcion.toLowerCase())) {
      tiposSet.add(opcion);

      // Eliminamos la opción encontrada del texto para dejar solo lo "no coincidente"
      const regex = new RegExp(opcion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      textToProcess = textToProcess.replace(regex, '');
    }
  }

  // Limpiamos comas y espacios sobrantes del residuo especificando los tipos explícitamente
  const residuoLimpio = textToProcess
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .join(', ');

  if (residuoLimpio) {
    tiposSet.add('Otro especifique');
  }

  return {
    tipos: Array.from(tiposSet),
    otroEspecifique: residuoLimpio
  };
};