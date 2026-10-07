// src/utils/matchers/certificacionesMatcher.ts
import { OPCIONES_CERTIFICACIONES } from './data/companyCatalog';

/**
 * Normaliza y compara las certificaciones recibidas desde el Excel contra OPCIONES_CERTIFICACIONES.
 * - Coincidencias del catálogo van al arreglo `lista`.
 * - Si hay elementos no pertenecientes al catálogo, agrega 'Otro especifique' a `lista` 
 *   y guarda los valores no coincidentes en `otroEspecifique`.
 */
export const parseCertificaciones = (rawVal: any) => {
  if (!rawVal) {
    return {
      lista: [],
      otroEspecifique: ''
    };
  }

  let textToProcess = rawVal.toString().trim().replace(/\s+/g, ' ');
  const listaSet = new Set<string>();

  // Filtramos 'Otro especifique' / 'Otro especifica' para buscar solo las certificaciones reales
  const opcionesConocidas = OPCIONES_CERTIFICACIONES.filter(
    (op: string) => !op.toLowerCase().includes('otro especifi')
  );

  // Ordenamos de mayor a menor longitud para evitar falsas coincidencias parciales
  opcionesConocidas.sort((a: string, b: string) => b.length - a.length);

  for (const opcion of opcionesConocidas) {
    if (textToProcess.toLowerCase().includes(opcion.toLowerCase())) {
      listaSet.add(opcion);

      // Eliminamos la opción encontrada del texto
      const regex = new RegExp(opcion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      textToProcess = textToProcess.replace(regex, '');
    }
  }

  // Limpiamos comas y espacios sobrantes del residuo
  const residuoLimpio = textToProcess
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .join(', ');

  if (residuoLimpio) {
    listaSet.add('Otro especifique');
  }

  return {
    lista: Array.from(listaSet),
    otroEspecifique: residuoLimpio
  };
};