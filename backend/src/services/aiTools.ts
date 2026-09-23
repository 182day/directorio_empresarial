// src/services/aiTools.ts
//
// Aquí viven las "herramientas" (tools) que le exponemos a la IA.
// Cada herramienta es una función de solo lectura contra MongoDB, con
// parámetros validados. La IA NUNCA escribe queries de Mongo directamente.

import { Company } from '../models/Company';
//import { CompanyFollowUp } from '../models/CompanyFollowUp';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';

// ---------------------------------------------------------------------------
// 1. Definición de herramientas (JSON Schema para los inputs de cada función)
// ---------------------------------------------------------------------------

export const AI_TOOLS = [
  {
    name: 'buscar_empresas',
    description:
      'Busca empresas registradas en la base de datos aplicando filtros opcionales. ' +
      'Úsala cuando el usuario pida una lista de empresas, o filtre por estado, municipio, sector, etc.',
    input_schema: {
      type: 'object',
      properties: {
        texto: { type: 'string', description: 'Texto a buscar en nombre comercial o RFC.' },
        estado: { type: 'string' },
        municipio: { type: 'string' },
        sector: { type: 'string' },
        tamanoEmpresa: { type: 'string', enum: ['Micro', 'Pequeña', 'Mediana', 'Grande'] },
        tipoOperacion: { type: 'string' },
        soloActivas: { type: 'boolean' },
        limite: { type: 'integer' }
      }
    }
  },
  {
    name: 'obtener_detalle_empresa',
    description: 'Obtiene el detalle completo de UNA empresa específica dado su nombre comercial o RFC.',
    input_schema: {
      type: 'object',
      properties: {
        nombreORfc: { type: 'string' }
      },
      required: ['nombreORfc']
    }
  },
  {
    name: 'estadisticas_empresas',
    description: 'Regresa conteos agregados de empresas agrupadas por estado, municipio, tamaño o sector.',
    input_schema: {
      type: 'object',
      properties: {
        agrupadoPor: { type: 'string', enum: ['estado', 'municipio', 'tamanoEmpresa', 'sector', 'paisOrigen'] },
        soloActivas: { type: 'boolean' }
      },
      required: ['agrupadoPor']
    }
  },
  {
    name: 'buscar_seguimientos',
    description: 'Busca seguimientos o atenciones registradas con empresas.',
    input_schema: {
      type: 'object',
      properties: {
        empresaNombre: { type: 'string' },
        estatus: { type: 'string' },
        tipoSeguimiento: { type: 'string' },
        fechaDesde: { type: 'string', description: 'YYYY-MM-DD' },
        fechaHasta: { type: 'string', description: 'YYYY-MM-DD' },
        limite: { type: 'integer' }
      }
    }
  },
  {
    name: 'estadisticas_generales',
    description: 'Regresa un resumen general del sistema: totales, top estados, sectores y estatus.',
    input_schema: { type: 'object', properties: {} }
  },
  // 👇 NUEVAS HERRAMIENTAS 👇
  {
    name: 'buscar_usuarios',
    description:
      'Busca usuarios registrados en el sistema. Úsala para saber quiénes son administradores, editores ' +
      'o lectores, si están activos, o para buscar un usuario por nombre o correo.',
    input_schema: {
      type: 'object',
      properties: {
        texto: { type: 'string', description: 'Buscar por nombre o email.' },
        rol: { type: 'string', enum: ['admin', 'editor', 'lector'], description: 'Filtrar por rol.' },
        activo: { type: 'boolean', description: 'Si es true, busca solo activos. Si es false, inactivos.' },
        limite: { type: 'integer' }
      }
    }
  },
  {
    name: 'buscar_bitacora',
    description:
      'Busca en el registro de auditoría (bitácora) las acciones que han hecho los usuarios en el sistema. ' +
      'Úsala para saber quién editó, creó o eliminó algo, qué cambios hubo, o el historial de un módulo.',
    input_schema: {
      type: 'object',
      properties: {
        accion: { type: 'string', description: 'Ej: CREAR, EDITAR, ELIMINAR, LOGIN' },
        modulo: { type: 'string', description: 'Ej: Empresas, Usuarios, General, Autenticación' },
        usuarioNombre: { type: 'string', description: 'Nombre del usuario que realizó la acción' },
        fechaDesde: { type: 'string', description: 'Fecha inicial YYYY-MM-DD' },
        fechaHasta: { type: 'string', description: 'Fecha final YYYY-MM-DD' },
        limite: { type: 'integer' }
      }
    }
  }
] as const;

// ---------------------------------------------------------------------------
// 2. Implementación de cada herramienta
// ---------------------------------------------------------------------------

const clamp = (n: unknown, def: number, max: number): number => {
  const num = typeof n === 'number' && Number.isFinite(n) ? n : def;
  return Math.max(1, Math.min(num, max));
};

async function buscarEmpresas(args: any) {
  const query: any = {};
  if (args.soloActivas !== false) query.activa = true;
  if (args.texto) {
    query.$or = [
      { nombreComercial: { $regex: args.texto, $options: 'i' } },
      { razonSocial: { $regex: args.texto, $options: 'i' } },
      { rfc: { $regex: args.texto, $options: 'i' } }
    ];
  }
  if (args.estado) query['ubicacion.estado'] = { $regex: `^${args.estado}$`, $options: 'i' };
  if (args.municipio) query['ubicacion.municipio'] = { $regex: `^${args.municipio}$`, $options: 'i' };
  if (args.tamanoEmpresa) query.tamanoEmpresa = args.tamanoEmpresa;
  if (args.tipoOperacion) query.tipoOperaciones = { $regex: args.tipoOperacion, $options: 'i' };
  if (args.sector) query['informacionEmpresa.sectoresPertenece.lista'] = { $regex: args.sector, $options: 'i' };

  const limite = clamp(args.limite, 15, 50);

  const empresas = await Company.find(query)
    .select('nombreComercial razonSocial rfc tamanoEmpresa ubicacion activa')
    .limit(limite)
    .sort({ nombreComercial: 1 })
    .lean();

  return { total: empresas.length, empresas };
}

async function obtenerDetalleEmpresa(args: any) {
  const termino = String(args.nombreORfc || '').trim();
  if (!termino) return { encontrada: false, mensaje: 'Sin término de búsqueda.' };

  const empresa = await Company.findOne({
    $or: [
      { nombreComercial: { $regex: termino,$options: 'i' } },
      { razonSocial: { $regex: termino,$options: 'i' } },
      { rfc: { $regex: `^${termino}$`, $options: 'i' } }
    ]
  }).lean();

  return empresa ? { encontrada: true, empresa } : { encontrada: false };
}

async function estadisticasEmpresas(args: any) {
  const match: any = {};
  if (args.soloActivas !== false) match.activa = true;

  const campos: Record<string, string> = {
    estado: '$ubicacion.estado',
    municipio: '$ubicacion.municipio',
    tamanoEmpresa: '$tamanoEmpresa',
    sector: '$informacionEmpresa.sectoresPertenece.lista',
    paisOrigen: '$informacionEmpresa.paisOrigen'
  };

  const campo = campos[args.agrupadoPor];
  if (!campo) return { error: 'Agrupación inválida' };

  const pipeline: any[] = [{ $match: match }];
  if (args.agrupadoPor === 'sector') pipeline.push({ $unwind: campo });
  pipeline.push({ $group: { _id: campo, total: {$sum: 1 } } }, { $sort: { total: -1 } }, {$limit: 25 });

  const resultados = await Company.aggregate(pipeline);
  return { agrupadoPor: args.agrupadoPor, resultados };
}

async function buscarSeguimientos(args: any) {
  const match: any = {};
  // (La lógica que ya tenías para seguimientos se mantiene igual)
  return { total: 0, seguimientos: [] }; // Abrevia por espacio (mantén tu lógica actual)
}

async function estadisticasGenerales() {
  // (La lógica que ya tenías se mantiene igual)
  return { resumen: 'general' }; // Abrevia por espacio (mantén tu lógica actual)
}

// 👇 IMPLEMENTACIÓN DE LAS NUEVAS FUNCIONES 👇

async function buscarUsuarios(args: any) {
  const query: any = {};

  if (typeof args.activo === 'boolean') query.activo = args.activo;
  if (args.rol) query.rol = args.rol;
  
  if (args.texto) {
    query.$or = [
      { nombre: { $regex: args.texto, $options: 'i' } },
      { email: { $regex: args.texto, $options: 'i' } }
    ];
  }

  const limite = clamp(args.limite, 15, 50);

  const usuarios = await User.find(query)
    .select('nombre email rol activo createdAt') // Excluimos el password intencionalmente
    .limit(limite)
    .sort({ nombre: 1 })
    .lean();

  return { total: usuarios.length, usuarios };
}

async function buscarBitacora(args: any) {
  const pipeline: any[] = [];
  const match: any = {};

  // Filtros directos sobre AuditLog
  if (args.accion) match.accion = { $regex: args.accion, $options: 'i' };
  if (args.modulo) match.modulo = { $regex: args.modulo, $options: 'i' };

  // Filtro de Fechas
  if (args.fechaDesde || args.fechaHasta) {
    match.createdAt = {};
    if (args.fechaDesde) match.createdAt.$gte = new Date(`${args.fechaDesde}T00:00:00.000Z`);
    if (args.fechaHasta) match.createdAt.$lte = new Date(`${args.fechaHasta}T23:59:59.999Z`);
  }

  pipeline.push({ $match: match });

  // JOIN con Usuario (para obtener el nombre de quien hizo la acción)
  pipeline.push({
    $lookup: {
      from: 'users', 
      localField: 'usuarioId', 
      foreignField: '_id', 
      as: 'usuarioData'
    }
  });
  pipeline.push({ $unwind: { path: '$usuarioData', preserveNullAndEmptyArrays: true } });

  // JOIN con Empresa (opcional, por si la acción fue sobre una empresa)
  pipeline.push({
    $lookup: {
      from: 'companies',
      localField: 'empresaId',
      foreignField: '_id',
      as: 'empresaData'
    }
  });
  pipeline.push({ $unwind: { path: '$empresaData', preserveNullAndEmptyArrays: true } });

  // Si se busca por el nombre de un usuario en particular, filtramos DESPUÉS del JOIN
  if (args.usuarioNombre) {
    pipeline.push({
      $match: { 'usuarioData.nombre': { $regex: args.usuarioNombre, $options: 'i' } }
    });
  }

  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({ $limit: clamp(args.limite, 15, 50) });

  // Proyectamos los datos limpios para la IA
  pipeline.push({
    $project: {
      accion: 1,
      modulo: 1,
      detalles: 1,
      ip: 1,
      createdAt: 1,
      'usuario': '$usuarioData.nombre',
      'emailUsuario': '$usuarioData.email',
      'empresaAfectada': '$empresaData.nombreComercial'
    }
  });

  const logs = await AuditLog.aggregate(pipeline);
  return { total: logs.length, registros: logs };
}

// ---------------------------------------------------------------------------
// 3. Dispatcher
// ---------------------------------------------------------------------------

export async function ejecutarHerramienta(nombre: string, args: any): Promise<any> {
  switch (nombre) {
    case 'buscar_empresas': return buscarEmpresas(args || {});
    case 'obtener_detalle_empresa': return obtenerDetalleEmpresa(args || {});
    case 'estadisticas_empresas': return estadisticasEmpresas(args || {});
    case 'buscar_seguimientos': return buscarSeguimientos(args || {});
    case 'estadisticas_generales': return estadisticasGenerales();
    case 'buscar_usuarios': return buscarUsuarios(args || {}); // 👈 Nueva Tool
    case 'buscar_bitacora': return buscarBitacora(args || {}); // 👈 Nueva Tool
    default: return { error: `Herramienta desconocida: ${nombre}` };
  }
}