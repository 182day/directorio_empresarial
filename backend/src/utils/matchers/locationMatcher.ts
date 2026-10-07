// src/utils/matchers/locationMatcher.ts
import { ESTADOS_MEXICO, EstadoLocation } from "./data/locationCatalog";

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

  // Si una cadena está contenida en la otra totalmente
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 0.85;
  }

  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  return 1 - distance / maxLength;
}

/**
 * Encuentra el estado y municipio del catálogo que más se parezcan a las entradas del Excel.
 * 
 * @param rawEstado - Texto del estado tal como viene en el Excel
 * @param rawMunicipio - Texto del municipio tal como viene en el Excel
 * @param minSimilarityThreshold - Umbral mínimo (default 0.4 / 40%) para aceptar una coincidencia
 */
export function matchLocation(
  rawEstado?: string,
  rawMunicipio?: string,
  minSimilarityThreshold = 0.4
): { estado: string; municipio: string } {
  let matchedEstado = rawEstado?.trim() || "";
  let matchedMunicipio = rawMunicipio?.trim() || "";

  if (!rawEstado) {
    return { estado: matchedEstado, municipio: matchedMunicipio };
  }

  // 1. Buscar la mejor coincidencia para el ESTADO
  let bestEstadoMatch: EstadoLocation | null = null;
  let highestEstadoScore = 0;

  for (const item of ESTADOS_MEXICO) {
    const score = getSimilarity(rawEstado, item.estado);
    if (score > highestEstadoScore) {
      highestEstadoScore = score;
      bestEstadoMatch = item;
    }
  }

  if (bestEstadoMatch && highestEstadoScore >= minSimilarityThreshold) {
    matchedEstado = bestEstadoMatch.estado;

    // 2. Buscar la mejor coincidencia para el MUNICIPIO dentro del estado encontrado
    if (rawMunicipio && bestEstadoMatch.municipios.length > 0) {
      let bestMunicipioMatch = "";
      let highestMunicipioScore = 0;

      for (const mun of bestEstadoMatch.municipios) {
        const score = getSimilarity(rawMunicipio, mun);
        if (score > highestMunicipioScore) {
          highestMunicipioScore = score;
          bestMunicipioMatch = mun;
        }
      }

      if (highestMunicipioScore >= minSimilarityThreshold) {
        matchedMunicipio = bestMunicipioMatch;
      }
    }
  }

  return {
    estado: matchedEstado,
    municipio: matchedMunicipio,
  };
}