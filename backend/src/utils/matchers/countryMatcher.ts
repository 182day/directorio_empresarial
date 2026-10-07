// src/utils/matchers/countryMatcher.ts
import { PAISES, Country } from "./data/countryCatalog";

/**
 * Normaliza un texto: quita acentos, caracteres especiales, espacios extra y convierte a minúsculas.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve diacríticos/acentos
    .replace(/[^a-z0-9\s]/g, "")     // Elimina caracteres especiales
    .trim()
    .replace(/\s+/g, " ");          // Unifica espacios
}

/**
 * Calcula la distancia de Levenshtein entre dos cadenas de texto.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitución
          matrix[i][j - 1] + 1,     // inserción
          matrix[i - 1][j] + 1      // borrado
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calcula un puntaje de similitud entre 0 y 1.
 */
function getSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);

  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1;

  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 0.85;
  }

  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  return 1 - distance / maxLength;
}

// Valores que representan la ausencia de exportaciones
const NEGATIVE_VALUES = new Set([
  'ninguno', 'ninguna', 'ningun', 'na', 'n/a', 'n.a.', 'n/a.', 'no', 'sin exportacion', 'sin exportaciones', '0', 'ninguno.'
]);

// Continentes o regiones geográficas que se pasan directamente sin hacer match de país
const REGIONES_CONTINENTES = [
  'america latina',
  'latinoamerica',
  'sudamerica',
  'suramerica',
  'norteamerica',
  'centroamerica',
  'europa',
  'asia',
  'africa',
  'oceania',
  'union europea',
  'medio oriente',
  'oriente medio'
];

/**
 * Encuentra el país del catálogo que más se parezca a la entrada del Excel.
 */
export function matchCountry(
  rawCountry?: string,
  defaultCountry = "México",
  minSimilarityThreshold = 0.4
): string {
  if (!rawCountry) return defaultCountry;

  const normalizedInput = normalizeText(rawCountry);
  if (!normalizedInput || NEGATIVE_VALUES.has(normalizedInput)) return defaultCountry;

  if (
    normalizedInput === "eeuu" ||
    normalizedInput === "usa" ||
    normalizedInput === "eua" ||
    normalizedInput === "estados unidos"
  ) {
    return "Estados Unidos de América";
  }

  let bestCountryMatch: Country | null = null;
  let highestScore = 0;

  for (const country of PAISES) {
    const scoreNombre = getSimilarity(rawCountry, country.nombre);
    const scoreName = getSimilarity(rawCountry, country.name);
    const scoreIso2 = getSimilarity(rawCountry, country.iso2);
    const scoreIso3 = getSimilarity(rawCountry, country.iso3);

    const maxCountryScore = Math.max(scoreNombre, scoreName, scoreIso2, scoreIso3);

    if (maxCountryScore > highestScore) {
      highestScore = maxCountryScore;
      bestCountryMatch = country;
    }
  }

  if (bestCountryMatch && highestScore >= minSimilarityThreshold) {
    return bestCountryMatch.nombre;
  }

  return defaultCountry;
}

/**
 * Procesa una cadena o lista de destinos de exportación.
 * - Filtra respuestas vacías/nulas como "Ninguno", "N/A", "0".
 * - Si es un continente/región (ej: "Europa", "América Latina"), pasa intacto formateado.
 * - Si es un país, aplica `matchCountry` con tolerancia a errores.
 */
export function parseDestinoExportaciones(rawInput: any): string[] {
  if (!rawInput) return [];

  const text = rawInput.toString().trim();
  if (!text) return [];

  // Separar por comas, diagonales o punto y coma
  const items = text.split(/[,;\/]+/).map((item: string) => item.trim()).filter(Boolean);
  const resultados: string[] = [];

  for (const item of items) {
    const normalizedItem = normalizeText(item);

    // 1. Omitir si es un valor negativo ("N/A", "Ninguno", etc.)
    if (NEGATIVE_VALUES.has(normalizedItem)) {
      continue;
    }

    // 2. Verificar si es un continente o región
    const esRegion = REGIONES_CONTINENTES.some((region) => {
      const score = getSimilarity(normalizedItem, region);
      return score >= 0.75 || normalizedItem.includes(region) || region.includes(normalizedItem);
    });

    if (esRegion) {
      // Formatear primera letra de cada palabra
      const formattedRegion = item
        .toLowerCase()
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      resultados.push(formattedRegion);
      continue;
    }

    // 3. Intentar hacer match como País
    const matched = matchCountry(item, '', 0.4);
    if (matched) {
      resultados.push(matched);
    }
  }

  // Eliminar duplicados en el arreglo final
  return Array.from(new Set(resultados));
}