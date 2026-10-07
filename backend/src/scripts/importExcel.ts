// src/scripts/importExcel.ts
import * as XLSX from 'xlsx';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { Company } from '../models/Company';
import { matchLocation } from '../utils/matchers/locationMatcher';
import { matchCountry, parseDestinoExportaciones } from '../utils/matchers/countryMatcher';
import { parseApoyosYNecesidades } from '../utils/matchers/apoyosMatcher';
import { parseCertificaciones } from '../utils/matchers/certificacionesMatcher';
import { parseSectorGenerico } from '../utils/matchers/sectoresMatcher';
import { parsePrincipalSectorAtiende } from '../utils/matchers/principalSectorMatcher';
import {
  OPCIONES_SECTORES,
  OPCIONES_SECTOR_PLASTICOS,
  OPCIONES_SECTOR_METALMECANICO,
  OPCIONES_SECTOR_ELECTRICA_ELECTRONICA,
  OPCIONES_SECTOR_EMPAQUE,
  OPCIONES_SECTOR_TI_I40,
  OPCIONES_SECTOR_TEXTIL,
  OPCIONES_SECTOR_SERVICIOS_ESPECIALIZADOS,
  OPCIONES_SECTOR_MROS,
  OPCIONES_SECTOR_MINERO
} from '../utils/matchers/data/companyCatalog';

dotenv.config();

// ==========================================
// FUNCIONES AUXILIARES DE LIMPIEZA DE DATOS
// ==========================================

// Limpia los extremos y reemplaza 2 o más espacios intermedios por uno solo
const cleanText = (val: any): string => {
  if (val === undefined || val === null) return '';
  return val.toString().trim().replace(/\s+/g, ' ');
};

/**
 * Formatea un texto a tipo título (Title Case), poniendo la primera letra de cada palabra
 * en mayúscula y manteniendo en minúscula conectores, preposiciones y artículos.
 */
const formatTitleCase = (val: any): string => {
  const text = cleanText(val);
  if (!text) return '';

  // Lista de conectores, artículos y preposiciones comunes en español
  const lowercaseWords = new Set([
    // --- Preposiciones ---
    'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'del', 'desde', 'durante', 'en', 'entre',
    'hacia', 'hasta', 'mediante', 'para', 'por', 'según', 'sin', 'so', 'sobre', 'tras', 'versus', 'vía',
    'excepto', 'salvo', 'pro', 'cerca', 'lejos', 'dentro', 'fuera', 'encima', 'debajo',
    'detrás', 'delante', 'alrededor', 'al',

    // --- Artículos, pronombres y posesivos apocopados ---
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo', 'son',
    'le', 'les', 'me', 'te', 'se', 'nos', 'os',
    'mi', 'mis', 'tu', 'tus', 'su', 'sus',
    'esto', 'eso', 'aquello',

    // --- Conjunciones y nexos ---
    'y', 'e', 'ni', 'que', 'o', 'u', 'pero', 'mas', 'sino',
    'pues', 'porque', 'ya', 'como', 'conque', 'si', 'aunque', 'siquiera',
    'puesto', 'visto', 'sea', 'ora', 'cuan', 'cuanto', 'tanto', 'tan', 'cada',

    // --- Relativos ---
    'quien', 'quienes', 'cual', 'cuales', 'cuyo', 'cuya', 'cuyos', 'cuyas',
    'donde', 'cuando',

    // --- Adverbios de tiempo, orden, lugar y modo ---
    'entonces', 'luego', 'después', 'mientras', 'antes', 'ahora', 'apenas', 'tarde',
    'también', 'tampoco', 'además', 'asimismo', 'incluso', 'aun', 'bien',
    'aquí', 'allá', 'así', 'igual',

    // --- Adjetivos / afirmación ---
    'cierto', 'obvio', 'evidente',

    // --- Adverbios en -mente ---
    'primeramente', 'simultáneamente', 'anteriormente', 'posteriormente', 'actualmente',
    'evidentemente', 'efectivamente', 'sencillamente', 'naturalmente', 'igualmente',

    // --- Abreviaturas ---
    'vs', 'etc', 'vs.', 'etc.',

    // --- Otras ---
    'en cambio', 'en todo caso', 'en resumen', 'en conclusión', 'en fin',
    'por ende', 'por consiguiente', 'en efecto', 'a causa de', 'debido a',
    'en consecuencia', 'sin embargo', 'no obstante', 'o sea', 'así que',
  ]);

  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (!word) return '';

      // La primera palabra de la cadena SIEMPRE va en mayúscula, 
      // de lo contrario se evalúa si es un conector para dejarla en minúscula.
      if (index === 0 || !lowercaseWords.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
};

// Mantiene únicamente caracteres numéricos
const cleanPhone = (val: any): string => {
  if (!val) return '';
  return val.toString().replace(/\D/g, '');
};

// Formatea el sitio web en minúsculas y valida/agrega http:// o https://
const formatWebsite = (val: any): string => {
  let url = cleanText(val).toLowerCase();
  if (!url) return '';

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
};

// Mapea la descripción de tamaño de empresa desde Excel al catálogo
const cleanTamanoEmpresa = (val: any): 'Micro' | 'Pequeña' | 'Mediana' | 'Grande' => {
  const str = cleanText(val).toLowerCase();

  if (str.includes('micro')) return 'Micro';
  if (str.includes('pequeña') || str.includes('pequena')) return 'Pequeña';
  if (str.includes('mediana')) return 'Mediana';
  if (str.includes('gran')) return 'Grande';

  return 'Micro'; // Valor por defecto en caso de no coincidir
};

const parseMarcaTemporal = (val: any): Date => {
  if (!val) return new Date();
  if (val instanceof Date) return val;

  const strVal = cleanText(val);
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?$/;
  const match = strVal.match(regex);

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const hours = match[4] ? Number(match[4]) : 0;
    const minutes = match[5] ? Number(match[5]) : 0;
    const seconds = match[6] ? Number(match[6]) : 0;

    const fecha = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(fecha.getTime())) return fecha;
  }

  const fallbackDate = new Date(strVal);
  return isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate;
};

/**
 * Limpia y normaliza cadenas o números que representan porcentajes.
 * Soporta:
 * - Textos sin número ('No', 'NA', 'Ninguna') -> defaultVal
 * - Porcentajes simples ('2%', '40%') -> 2, 40
 * - Valores con ceros de más ('3000%', '1500%') -> 30, 15
 * - Rangos ('90%-95%', '90% a 95%', 'entre 90% y 95%') -> toma el primer valor (90)
 * - Decimales ('0.02', '0.03', '0.45') -> 2, 3, 45
 */
const cleanPercentage = (val: any, defaultVal = 0): number => {
  if (val === undefined || val === null || val === '') return defaultVal;

  const strVal = val.toString().trim();

  // Buscar el primer número entero o decimal en el texto
  const match = strVal.match(/(\d+(?:\.\d+)?)/);
  if (!match) return defaultVal;

  let num = Number(match[1]);
  if (isNaN(num)) return defaultVal;

  // 1. Si metieron ceros de más (ej. 3000, 1500, 10000)
  if (num > 100 && num % 100 === 0) {
    num = num / 100;
  }

  // 2. Si el valor viene como decimal (e.g. 0.02, 0.45, etc.), convertirlo a porcentaje
  if (num > 0 && num < 1) {
    num = Math.round(num * 100);
  } else {
    num = Math.round(num);
  }

  // Acotar al rango permitido [0, 100]
  if (num > 100) return 100;
  if (num < 0) return 0;
  return num;
};

const parseCoordinate = (val: any): number | undefined => {
  if (val === undefined || val === null || val === '') return undefined;
  const strVal = cleanText(val);
  const num = Number(strVal);
  return isNaN(num) ? undefined : num;
};

// ==========================================
// FUNCIÓN REUTILIZABLE DE PROCESAMIENTO EXCEL
// ==========================================
export const processExcelFile = async (filePath: string) => {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const rawData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  let guardados = 0;
  let omitidos = 0;

  for (let index = 0; index < rawData.length; index++) {
    const row = rawData[index];

    const getVal = (key: string): string => {
      return row[key] !== undefined && row[key] !== null ? cleanText(row[key]) : '';
    };

    // 1. OBTENER DATOS ESENCIALES
    const rawRfc = getVal('RFC:').toUpperCase();
    const nombreComercial = getVal('Nombre Comercial:');
    const razonSocial = getVal('Nombre o Razón Social:');
    const correoEmpresa = (getVal('Dirección de correo electrónico') || getVal('Correo electrónico:')).toLowerCase();

    // 🛑 VALIDACIÓN DE FILAS VACÍAS:
    if (!rawRfc && !nombreComercial && !razonSocial && !correoEmpresa) {
      continue;
    }

    const toArray = (key: string): string[] => {
      const val = getVal(key);
      return val ? val.split(',').map((s: string) => cleanText(s)).filter(Boolean) : [];
    };

    // Si tiene datos pero no RFC, asignar un RFC temporal determinista por fila
    const rfc = rawRfc || `TEMP-RFC-ROW-${index + 1}`;

    const tamano = cleanTamanoEmpresa(getVal('Tamaño de la empresa:'));
    const fechaMarcaTemporal = parseMarcaTemporal(row['Marca temporal'] || row['Marca Temporal'] || row['Timestamp']);
    const latitud = parseCoordinate(row['Latitud'] || row['latitud'] || row['Latitud:']);
    const longitud = parseCoordinate(row['Longitud'] || row['longitud'] || row['Longitud:']);

    // Unificación y coincidencia de ubicación mediante catálogo oficial
    const rawEstado = getVal('Estado') || 'Querétaro';
    const rawMunicipio = getVal('Municipio/ Ciudad:') || 'Querétaro';
    const { estado: matchedEstado, municipio: matchedMunicipio } = matchLocation(rawEstado, rawMunicipio);

    // Matching del País de Origen contra countryCatalog.ts
    const rawPaisOrigen = getVal('País de Origen:');
    const matchedPaisOrigen = matchCountry(rawPaisOrigen, 'México');

    // Construcción dinámica de la ubicación para evitar sobrescribir coordenadas vacías
    const ubicacionObj: any = {
      estado: matchedEstado || 'Querétaro',
      municipio: matchedMunicipio || 'Querétaro',
      direccion: formatTitleCase(getVal('Dirección (calle y número):')) || 'Sin Dirección Registrada',
      colonia: formatTitleCase(getVal('Colonia:')) || 'Centro',
      codigoPostal: getVal('Código Postal:') || '76000',
      parqueIndustrial: getVal('Parque Industrial:'),
    };

    if (latitud !== undefined) ubicacionObj.latitud = latitud;
    if (longitud !== undefined) ubicacionObj.longitud = longitud;

    // Parseo individual de subsectores
    const rawPlasticos = getVal('Sector Plásticos:');
    const rawMetalmecanico = getVal('Sector metalmecánico:');
    const rawElectricaElectronica = getVal('Sector eléctrico-electrónico:');
    const rawEmpaque = getVal('Sector Empaque:');
    const rawTiI40 = getVal('Sector de tecnologías e información:');
    const rawTextil = getVal('Sector textil:');
    const rawServiciosEspecializados = getVal('Sector servicios especializados:');
    const rawMros = getVal('Sector MROS:');
    const rawMinero = getVal('Sector Minero');

    const sectorPlasticosObj = parseSectorGenerico(rawPlasticos, OPCIONES_SECTOR_PLASTICOS);
    const sectorMetalmecanicoObj = parseSectorGenerico(rawMetalmecanico, OPCIONES_SECTOR_METALMECANICO);
    const sectorElectricaElectronicaObj = parseSectorGenerico(rawElectricaElectronica, OPCIONES_SECTOR_ELECTRICA_ELECTRONICA);
    const sectorEmpaqueObj = parseSectorGenerico(rawEmpaque, OPCIONES_SECTOR_EMPAQUE);
    const sectorTiI40Obj = parseSectorGenerico(rawTiI40, OPCIONES_SECTOR_TI_I40);
    const sectorTextilObj = parseSectorGenerico(rawTextil, OPCIONES_SECTOR_TEXTIL);
    const sectorServiciosEspecializadosObj = parseSectorGenerico(rawServiciosEspecializados, OPCIONES_SECTOR_SERVICIOS_ESPECIALIZADOS);
    const sectorMrosObj = parseSectorGenerico(rawMros, OPCIONES_SECTOR_MROS);
    const sectorMineroObj = parseSectorGenerico(rawMinero, OPCIONES_SECTOR_MINERO);

    // Mapeo dinámico de sectoresPertenece
    const sectoresPerteneceObj = parseSectorGenerico(
      getVal('Sector(es) al(los) que pertenece(n):'),
      OPCIONES_SECTORES,
      'Otro especifica'
    );

    // Inferencia de sectores generales a partir de los subsectores con datos
    const subsectorMap: Array<{ hasData: boolean; sectorNombre: string }> = [
      { hasData: !!(rawPlasticos || sectorPlasticosObj.lista.length), sectorNombre: 'Plásticos' },
      { hasData: !!(rawMetalmecanico || sectorMetalmecanicoObj.lista.length), sectorNombre: 'Metalmecánico' },
      { hasData: !!(rawElectricaElectronica || sectorElectricaElectronicaObj.lista.length), sectorNombre: 'Eléctrica-Electrónica' },
      { hasData: !!(rawEmpaque || sectorEmpaqueObj.lista.length), sectorNombre: 'Empaque' },
      { hasData: !!(rawTiI40 || sectorTiI40Obj.lista.length), sectorNombre: 'TI e I4.0' },
      { hasData: !!(rawTextil || sectorTextilObj.lista.length), sectorNombre: 'Textil' },
      { hasData: !!(rawServiciosEspecializados || sectorServiciosEspecializadosObj.lista.length), sectorNombre: 'Servicios' },
      { hasData: !!(rawMros || sectorMrosObj.lista.length), sectorNombre: 'Automotriz' },
      { hasData: !!(rawMinero || sectorMineroObj.lista.length), sectorNombre: 'Minero' },
    ];

    const listaSetSectores = new Set<string>(sectoresPerteneceObj.lista);

    subsectorMap.forEach(({ hasData, sectorNombre }) => {
      if (hasData) {
        listaSetSectores.add(sectorNombre);
      }
    });

    // Mantenemos 'Otro especifica' siempre al final si existe
    if (listaSetSectores.has('Otro especifica')) {
      listaSetSectores.delete('Otro especifica');
      listaSetSectores.add('Otro especifica');
    }

    sectoresPerteneceObj.lista = Array.from(listaSetSectores);

    // Mapeo dinámico de principalSectorAtiende y principalSectorAtiendeOtro
    const { principalSectorAtiende, principalSectorAtiendeOtro } = parsePrincipalSectorAtiende(
      row['Principal sector al que atiende:'] || row['Principal sector al que atiende']
    );

    const companyData = {
      tipoEmpresa: 'Empresa directorio',
      correoElectronico: correoEmpresa || `empresa_${index + 1}@directorio.com`,
      nombreComercial: nombreComercial || `Empresa ${index + 1}`,
      razonSocial: razonSocial || nombreComercial || `Razón Social ${index + 1}`,
      rfc,
      tamanoEmpresa: tamano,
      anioInicio: Number(getVal('Año de inicio de operaciones:')) || 2000,
      sitioWeb: formatWebsite(getVal('Sitio Web:')),
      etiquetas: [],
      tipoSuministro: toArray('Tipo de suministro:').length > 0 ? toArray('Tipo de suministro:') : ['Directo'],
      tipoOperaciones: toArray('Tipo de operaciones:').length > 0 ? toArray('Tipo de operaciones:') : ['Fabricación'],

      ubicacion: ubicacionObj,

      contactos: {
        directorGeneral: {
          nombreCompleto: formatTitleCase(getVal('Nombre Completo:')) || 'No especificado',
          telefono: cleanPhone(getVal('Teléfono:')),
          celularWhatsapp: cleanPhone(getVal('Celular con WhatsApp:')),
          correoElectronico: (getVal('Correo electrónico:') || correoEmpresa).toLowerCase()
        },
        compras: {
          nombreCompleto: formatTitleCase(getVal('Nombre Completo: 2')),
          cargo: formatTitleCase(getVal('Cargo:')),
          telefono: cleanPhone(getVal('Teléfono: 2')),
          celularWhatsapp: cleanPhone(getVal('Celular con WhatsApp: ')),
          correoElectronico: getVal('Correo electrónico: 2').toLowerCase()
        },
        ventas: {
          nombreCompleto: formatTitleCase(getVal('Nombre completo:2')),
          cargo: formatTitleCase(getVal('Cargo: 2')),
          telefono: cleanPhone(getVal('Teléfono: 3')),
          celularWhatsapp: cleanPhone(getVal('Celular con WhatsApp: 2')),
          correoElectronico: getVal('Correo electrónico: ').toLowerCase()
        },
        recursosHumanos: {
          nombreCompleto: formatTitleCase(getVal('Nombre completo: 23')),
          cargo: formatTitleCase(getVal('Cargo: 3')),
          telefono: cleanPhone(getVal('Teléfono: 4')),
          celularWhatsapp: cleanPhone(getVal('Celular con WhatsApp: 3')),
          correoElectronico: getVal('Correo electrónico: 3').toLowerCase()
        }
      },

      informacionEmpresa: {
        productosFabrica: getVal('Productos que Fabrica:') || 'N/A',
        principalesClientes: getVal('Principales clientes:'),
        paisOrigen: matchedPaisOrigen,
        porcentajeInversionNacional: cleanPercentage(row['Porcentaje de inversión nacional: '], 100),
        porcentajeInversionExtranjero: cleanPercentage(row['Porcentaje de inversión extranjero: '], 0),
        
        // Mapeo dinámico de Certificaciones
        certificaciones: parseCertificaciones(getVal('Certificaciones:')),

        // Mapeo unificado de sectoresPertenece
        sectoresPertenece: sectoresPerteneceObj,

        // Mapeo dinámico de subsectores específicos
        sectorPlasticos: sectorPlasticosObj,
        sectorMetalmecanico: sectorMetalmecanicoObj,
        sectorElectricaElectronica: sectorElectricaElectronicaObj,
        sectorEmpaque: sectorEmpaqueObj,
        sectorTiI40: sectorTiI40Obj,
        sectorTextil: sectorTextilObj,
        sectorServiciosEspecializados: sectorServiciosEspecializadosObj,
        sectorMros: sectorMrosObj,
        sectorMinero: sectorMineroObj,

        principalSectorAtiende,
        principalSectorAtiendeOtro,
        porcentajeExportaciones: cleanPercentage(row['Porcentaje de exportaciones:'], 0),
        destinoExportaciones: parseDestinoExportaciones(getVal('Favor de especificar el destino de sus exportaciones:'))
      },

      retosActuales: getVal('¿Cuáles son los principales retos que enfrenta actualmente su empresa?') || 'Sin especificar',

      // Mapeo dinámico de apoyos/necesidades con 'Otro especifique'
      apoyosYNecesidades: parseApoyosYNecesidades(
        getVal('¿Qué tipo de apoyo o necesidades tiene actualmente su empresa?')
      ),

      presentacionComercial: getVal('Presentación Comercial:'),
      activa: true,
      createdAt: fechaMarcaTemporal,
      updatedAt: fechaMarcaTemporal
    };

    try {
      // Opción 1: Sobrescribir registros existentes
      const result = await Company.updateOne(
        { rfc: companyData.rfc },
        { $set: companyData },
        { upsert: true, runValidators: true, timestamps: false }
      );

      // // Opción 2: Insertar SOLO registros NUEVOS sin modificar existentes
      // const result = await Company.updateOne(
      //   { rfc: companyData.rfc },
      //   { $setOnInsert: companyData },
      //   { upsert: true, runValidators: true, timestamps: false }
      // );

      if (result.upsertedCount > 0 || result.modifiedCount > 0) {
        guardados++;
      } else {
        omitidos++;
      }
    } catch (err: any) {
      omitidos++;
    }
  }

  return { guardados, omitidos, total: rawData.length };
};

// ==========================================
// EJECUCIÓN VÍA CONSOLA / CLI (npx tsx)
// ==========================================
const runCLI = async () => {
  const isDirectRun = process.argv[1] && (
    process.argv[1].endsWith('importExcel.ts') ||
    process.argv[1].endsWith('importExcel.js')
  );

  if (isDirectRun) {
    try {
      console.log('🔌 Conectando a la base de datos...');
      await connectDB();

      const defaultPath = path.join(__dirname, '../assets/directorio.xlsx');
      console.log(`📁 Leyendo archivo local desde: ${defaultPath}`);

      const res = await processExcelFile(defaultPath);

      console.log('\n================ RESULTADOS ================');
      console.log(`Total de registros procesados: ${res.total}`);
      console.log(`Registros insertados/actualizados: ${res.guardados}`);
      console.log(`Registros sin cambios/omitidos:   ${res.omitidos}`);
      console.log('============================================\n');

      process.exit(0);
    } catch (error) {
      console.error('❌ Error ejecutando importación desde CLI:', error);
      process.exit(1);
    }
  }
};

runCLI();