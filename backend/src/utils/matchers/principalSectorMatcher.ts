// src/utils/matchers/principalSectorMatcher.ts
import { OPCIONES_SECTORES } from './data/companyCatalog';

// Mapa de alias o variaciones comunes para tolerar errores ortográficos o abreviaturas
const ALIAS_MAP: Array<{ regex: RegExp; target: string }> = [
  { regex: /\b(auto|automotriz|automotrice|automotiv)\b/i, target: 'Automotriz' },
  { regex: /\b(aero|aeroespacial|aerospacial|aeronautic|aeronautica)\b/i, target: 'Aeroespacial' },
  { regex: /\b(tec|tecnologia|tecnologías|software|sistemas|it|ti)\b/i, target: 'TI e I4.0' },
  { regex: /\b(electrica|electrico|electronica|electronico|eléctrica|electrónica)\b/i, target: 'Eléctrica-Electrónica' },
  { regex: /\b(metal|metalmecanica|metalmecanico|metalmecánico)\b/i, target: 'Metalmecánico' },
  { regex: /\b(plastico|plasticos|plástico|plásticos)\b/i, target: 'Plásticos' },
  { regex: /\b(medico|salud|hospital|hospitalario|farma)\b/i, target: 'Hospitalario' },
  { regex: /\b(servicio|servicios)\b/i, target: 'Servicios' },
  { regex: /\b(alimento|alimentos|bebida|bebidas)\b/i, target: 'Alimentos' },
  { regex: /\b(energia|energético|energetico)\b/i, target: 'Energético' },
  { regex: /\b(logistica|logística|transporte)\b/i, target: 'Logística' },
  { regex: /\b(empaque|embalaje)\b/i, target: 'Empaque' },
  { regex: /\b(textil|confección)\b/i, target: 'Textil' },
  { regex: /\b(minero|mineria|minería)\b/i, target: 'Minero' },
  { regex: /\b(comercio|comercial)\b/i, target: 'Comercio' },
  { regex: /\b(investigación|investigacion|ciidet)\b/i, target: 'Centro de investigación' },
  { regex: /\b(academia|educacion|educación|universidad)\b/i, target: 'Academia' },
  { regex: /\b(biotecnologia|biotecnología)\b/i, target: 'Biotecnología' },
];

export const parsePrincipalSectorAtiende = (rawVal: any): { principalSectorAtiende: string; principalSectorAtiendeOtro: string } => {
  const originalStr = rawVal !== undefined && rawVal !== null ? rawVal.toString().trim() : '';

  if (!originalStr) {
    return {
      principalSectorAtiende: 'Otro',
      principalSectorAtiendeOtro: ''
    };
  }

  // Filtrar del catálogo oficial las opciones que no sean variaciones de 'Otro'
  const opcionesConocidas = OPCIONES_SECTORES.filter(
    (op) => !op.toLowerCase().includes('otro especifi')
  );

  // 1. EVALUAR PRIMERO COINCIDENCIAS CON EL CATÁLOGO OFICIAL
  // Ordenamos de mayor a menor longitud para evitar falsos positivos con palabras cortas
  const catalogoOrdenado = [...opcionesConocidas].sort((a, b) => b.length - a.length);

  // Buscamos cuál de los sectores del catálogo aparece PRIMERO en el texto
  let primerIndexEncontrado = Infinity;
  let sectorElegido = '';

  for (const opcion of catalogoOrdenado) {
    const lowerText = originalStr.toLowerCase();
    const lowerOp = opcion.toLowerCase();
    const idx = lowerText.indexOf(lowerOp);

    if (idx !== -1 && idx < primerIndexEncontrado) {
      primerIndexEncontrado = idx;
      sectorElegido = opcion;
    }
  }

  if (sectorElegido) {
    return {
      principalSectorAtiende: sectorElegido,
      principalSectorAtiendeOtro: originalStr
    };
  }

  // 2. SI NO HUBO COINCIDENCIA DIRECTA, BUSCAR VÍA ALIAS/VARIACIONES
  let primerAliasIndex = Infinity;
  let sectorAliasElegido = '';

  for (const { regex, target } of ALIAS_MAP) {
    const match = regex.exec(originalStr);
    if (match && match.index < primerAliasIndex) {
      primerAliasIndex = match.index;
      sectorAliasElegido = target;
    }
  }

  if (sectorAliasElegido) {
    return {
      principalSectorAtiende: sectorAliasElegido,
      principalSectorAtiendeOtro: originalStr
    };
  }

  // 3. SI NO SE PARECE A NINGUNO DEL CATÁLOGO NI ALIAS
  return {
    principalSectorAtiende: 'Otro',
    principalSectorAtiendeOtro: originalStr
  };
};