// src/utils/matchers/sectoresMatcher.ts

/**
 * Función genérica para parsear y hacer match de sectores y subsectores contra sus catalogos de OPCIONES_*.
 * - Coincidencias del catálogo van al arreglo `lista`.
 * - Si hay elementos no pertenecientes al catálogo, agrega 'Otro especifica' (u 'Otro especifique') a `lista` 
 *   y guarda los valores no coincidentes en `otroEspecifique`.
 */
export const parseSectorGenerico = (
  rawVal: any,
  opcionesCatalogo: string[],
  tagOtro: string = 'Otro especifica'
) => {
  if (!rawVal) {
    return {
      lista: [],
      otroEspecifique: ''
    };
  }

  let textToProcess = rawVal.toString().trim().replace(/\s+/g, ' ');
  const listaSet = new Set<string>();

  // Filtramos etiquetas de 'Otro' del catálogo para evaluar únicamente las opciones reales
  const opcionesConocidas = opcionesCatalogo.filter(
    (op: string) => !op.toLowerCase().includes('otro especifi')
  );

  // Ordenamos de mayor a menor longitud para evitar que opciones cortas consuman partes de opciones largas
  opcionesConocidas.sort((a: string, b: string) => b.length - a.length);

  for (const opcion of opcionesConocidas) {
    if (textToProcess.toLowerCase().includes(opcion.toLowerCase())) {
      listaSet.add(opcion);

      // Removemos la opción encontrada del texto
      const regex = new RegExp(opcion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      textToProcess = textToProcess.replace(regex, '');
    }
  }

  // Limpiamos comas y espacios sobrantes del residuo resultante
  const residuoLimpio = textToProcess
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .join(', ');

  if (residuoLimpio) {
    listaSet.add(tagOtro);
  }

  return {
    lista: Array.from(listaSet),
    otroEspecifique: residuoLimpio
  };
};