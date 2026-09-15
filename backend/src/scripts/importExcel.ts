import * as XLSX from 'xlsx';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { Company } from '../models/Company';

dotenv.config();

async function importData() {
  try {
    await connectDB();

    const filePath = path.join(__dirname, '../assets/directorio.xlsx');
    console.log(`Leyendo archivo desde: ${filePath}`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rawData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`Procesando ${rawData.length} registros desde el Excel...`);

    let guardados = 0;
    let omitidos = 0;

    // Helper para limpiar y normalizar valores de porcentaje entre 0 y 100
    const cleanPercentage = (val: any, defaultVal = 0): number => {
      if (val === undefined || val === null || val === '') return defaultVal;
      // Eliminar símbolos de moneda, comas y espacios por si ingresaron montos
      const strVal = val.toString().replace(/[\$,]/g, '').trim();
      const num = Number(strVal);
      if (isNaN(num)) return defaultVal;
      // Si el usuario escribió un monto alto (ej: 1000000) o más de 100, asignamos 100%
      if (num > 100) return 100;
      if (num < 0) return 0;
      return num;
    };

    const parseCoordinate = (val: any): number | undefined => {
      if (val === undefined || val === null || val === '') return undefined;
      const strVal = val.toString().trim();
      const num = Number(strVal);
      return isNaN(num) ? undefined : num;
    };

    for (let index = 0; index < rawData.length; index++) {
      const row = rawData[index];

      const getVal = (key: string): string => {
        return row[key] !== undefined && row[key] !== null ? row[key].toString().trim() : '';
      };

      const toArray = (key: string): string[] => {
        const val = getVal(key);
        return val ? val.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      };

      const parseEspecialidadSector = (key: string) => {
        const val = getVal(key);
        if (!val) return undefined;
        const lista = val.split(',').map((s: string) => s.trim()).filter(Boolean);
        return { lista, otroEspecifique: '' };
      };

      let rfc = getVal('RFC:').toUpperCase();
      if (!rfc) {
        rfc = `TEMP-RFC-${index + 1}`;
      }

      let tamano = getVal('Tamaño de la empresa:');
      if (!['Micro', 'Pequeña', 'Mediana', 'Grande'].includes(tamano)) {
        tamano = 'Micro';
      }

      const correoEmpresa = (getVal('Dirección de correo electrónico') || getVal('Correo electrónico:')).toLowerCase() || `empresa_${index}@directorio.com`;

      const companyData = {
        correoElectronico: correoEmpresa,
        nombreComercial: getVal('Nombre Comercial:') || `Empresa ${index + 1}`,
        razonSocial: getVal('Nombre o Razón Social:') || getVal('Nombre Comercial:') || `Razón Social ${index + 1}`,
        rfc,
        tamanoEmpresa: tamano,
        anioInicio: Number(getVal('Año de inicio de operaciones:')) || 2000,
        sitioWeb: getVal('Sitio Web:'),
        etiquetas: [],
        tipoSuministro: toArray('Tipo de suministro:').length > 0 ? toArray('Tipo de suministro:') : ['Directo'],
        tipoOperaciones: toArray('Tipo de operaciones:').length > 0 ? toArray('Tipo de operaciones:') : ['Fabricación'],

        ubicacion: {
          estado: getVal('Estado') || 'Querétaro',
          municipio: getVal('Municipio/ Ciudad:') || 'Querétaro',
          direccion: getVal('Dirección (calle y número):') || 'Sin dirección registrada',
          colonia: getVal('Colonia:') || 'Centro',
          codigoPostal: getVal('Código Postal:') || '76000',
          parqueIndustrial: getVal('Parque Industrial:'),
          latitud: parseCoordinate(row['Latitud'] || row['latitud'] || row['Latitud:']),
          longitud: parseCoordinate(row['Longitud'] || row['longitud'] || row['Longitud:'])
        },

        contactos: {
          directorGeneral: {
            nombreCompleto: getVal('Nombre Completo:') || 'No especificado',
            telefono: getVal('Teléfono:'),
            celularWhatsapp: getVal('Celular con WhatsApp:'),
            correoElectronico: (getVal('Correo electrónico:') || correoEmpresa).toLowerCase()
          },
          compras: {
            nombreCompleto: getVal('Nombre Completo: 2'),
            cargo: getVal('Cargo:'),
            telefono: getVal('Teléfono: 2'),
            celularWhatsapp: getVal('Celular con WhatsApp: '),
            correoElectronico: getVal('Correo electrónico: 2').toLowerCase()
          },
          ventas: {
            nombreCompleto: getVal('Nombre completo:2'),
            cargo: getVal('Cargo: 2'),
            telefono: getVal('Teléfono: 3'),
            celularWhatsapp: getVal('Celular con WhatsApp: 2'),
            correoElectronico: getVal('Correo electrónico: ').toLowerCase()
          },
          recursosHumanos: {
            nombreCompleto: getVal('Nombre completo: 23'),
            cargo: getVal('Cargo: 3'),
            telefono: getVal('Teléfono: 4'),
            celularWhatsapp: getVal('Celular con WhatsApp: 3'),
            correoElectronico: getVal('Correo electrónico: 3').toLowerCase()
          }
        },

        informacionEmpresa: {
          productosFabrica: getVal('Productos que Fabrica:') || 'N/A',
          principalesClientes: getVal('Principales clientes:'),
          paisOrigen: getVal('País de Origen:') || 'México',
          // Aplicar limpieza a porcentajes
          porcentajeInversionNacional: cleanPercentage(row['Porcentaje de inversión nacional: '], 100),
          porcentajeInversionExtranjero: cleanPercentage(row['Porcentaje de inversión extranjero: '], 0),
          certificaciones: {
            lista: toArray('Certificaciones:')
          },
          sectoresPertenece: {
            lista: toArray('Sector(es) al(los) que pertenece(n):')
          },
          sectorPlasticos: parseEspecialidadSector('Sector Plásticos:'),
          sectorMetalmecanico: parseEspecialidadSector('Sector metalmecánico:'),
          sectorElectricaElectronica: parseEspecialidadSector('Sector eléctrico-electrónico:'),
          sectorEmpaque: parseEspecialidadSector('Sector Empaque:'),
          sectorTiI40: parseEspecialidadSector('Sector de tecnologías e información:'),
          sectorTextil: parseEspecialidadSector('Sector textil:'),
          sectorServiciosEspecializados: parseEspecialidadSector('Sector servicios especializados:'),
          sectorMros: parseEspecialidadSector('Sector MROS:'),
          sectorMinero: parseEspecialidadSector('Sector Minero'),
          principalSectorAtiende: getVal('Principal sector al que atiende:') || 'General',
          porcentajeExportaciones: cleanPercentage(row['Porcentaje de exportaciones:'], 0),
          destinoExportaciones: toArray('Favor de especificar el destino de sus exportaciones:')
        },

        retosActuales: getVal('¿Cuáles son los principales retos que enfrenta actualmente su empresa?') || 'Sin especificar',
        apoyosYNecesidades: {
          tipos: toArray('¿Qué tipo de apoyo o necesidades tiene actualmente su empresa?')
        },
        presentacionComercial: getVal('Presentación Comercial:'),
        activa: true
      };

      try {
        await Company.updateOne(
          { rfc: companyData.rfc },
          { $set: companyData },
          { upsert: true, runValidators: true }
        );
        guardados++;
      } catch (err: any) {
        console.error(`Error guardando fila ${index + 1} (${companyData.nombreComercial}):`, err.message);
        omitidos++;
      }
    }

    console.log(`\n¡Importación finalizada!`);
    console.log(`Guardados/Actualizados con éxito: ${guardados}`);
    console.log(`Omitidos o con error: ${omitidos}`);

    process.exit(0);
  } catch (error) {
    console.error('Error general en el proceso de importación:', error);
    process.exit(1);
  }
}

importData();