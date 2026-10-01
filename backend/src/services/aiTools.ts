// src/services/aiTools.ts
//
// Aquí viven las "herramientas" (tools) que le exponemos a la IA.
// Cada herramienta es una función de solo lectura contra MongoDB, con
// parámetros validados. La IA NUNCA escribe queries de Mongo directamente.

import { Company } from '../models/Company';
import { CompanyFollowUp } from '../models/CompanyFollowUp';
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
      'Úsala cuando el usuario pida una lista de empresas, quiera filtrar por estado, ' +
      'municipio, sector, tamaño o tipo de operación, o busque por nombre/RFC.',
    input_schema: {
      type: 'object',
      properties: {
        texto: {
          type: 'string',
          description: 'Texto libre a buscar en nombre comercial, razón social o RFC.'
        },
        tipoEmpresa: {
          type: 'string',
          description: 'Filtra por el tipo de registro (ej. "Empresa directorio" o "Empresa incompleta").'
        },
        estado: { type: 'string', description: 'Estado de la República donde se ubica la empresa.' },
        municipio: { type: 'string', description: 'Municipio donde se ubica la empresa.' },
        sector: {
          type: 'string',
          description: 'Sector al que pertenece la empresa (ej. Plásticos, Metalmecánico, Textil, etc.).'
        },
        tamanoEmpresa: {
          type: 'string',
          enum: ['Micro', 'Pequeña', 'Mediana', 'Grande'],
          description: 'Tamaño de la empresa.'
        },
        tipoOperacion: { type: 'string', description: 'Tipo de operación que realiza la empresa.' },
        soloActivas: {
          type: 'boolean',
          description: 'Si es true (por defecto), solo regresa empresas activas/aprobadas.'
        },
        limite: {
          type: 'integer',
          description: 'Número máximo de resultados a regresar (por defecto 15, máximo 50).'
        }
      }
    }
  },
  {
    name: 'obtener_detalle_empresa',
    description:
      'Obtiene el detalle completo de UNA empresa específica dado su nombre comercial, ' +
      'razón social o RFC. Úsala cuando el usuario pregunte por datos concretos de una empresa ' +
      '(contactos, exportaciones, certificaciones, retos, apoyos, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        nombreORfc: {
          type: 'string',
          description: 'Nombre comercial, razón social o RFC de la empresa a buscar.'
        }
      },
      required: ['nombreORfc']
    }
  },
  {
    name: 'estadisticas_empresas',
    description:
      'Regresa conteos agregados de empresas agrupadas por un campo (estado, municipio, ' +
      'tamaño, sector o país de origen). Úsala para preguntas tipo "¿cuántas empresas hay en...", ' +
      '"¿cuál es el sector con más empresas?", "distribución por tamaño", etc.',
    input_schema: {
      type: 'object',
      properties: {
        agrupadoPor: {
          type: 'string',
          enum: ['estado', 'municipio', 'tamanoEmpresa', 'sector', 'paisOrigen'],
          description: 'Campo por el cual agrupar el conteo.'
        },
        soloActivas: {
          type: 'boolean',
          description: 'Si es true (por defecto), solo cuenta empresas activas/aprobadas.'
        }
      },
      required: ['agrupadoPor']
    }
  },
  {
    name: 'buscar_seguimientos',
    description:
      'Busca seguimientos (contactos/atenciones) registrados con empresas. Úsala cuando el ' +
      'usuario pregunte por seguimientos, atenciones, pendientes, o el historial de contacto ' +
      'con una empresa en particular.',
    input_schema: {
      type: 'object',
      properties: {
        empresaNombre: { type: 'string', description: 'Nombre comercial de la empresa a filtrar.' },
        estatus: { type: 'string', description: 'Estatus del seguimiento (ej. "En Proceso", "Cerrado").' },
        tipoSeguimiento: { type: 'string', description: 'Tipo de seguimiento.' },
        esVinculacion: { type: 'boolean', description: 'Si es true, filtra solo los seguimientos que son vinculación.' },
        fechaDesde: { type: 'string', description: 'Fecha inicial (YYYY-MM-DD) del rango a buscar.' },
        fechaHasta: { type: 'string', description: 'Fecha final (YYYY-MM-DD) del rango a buscar.' },
        limite: { type: 'integer', description: 'Número máximo de resultados (por defecto 15, máximo 50).' }
      }
    }
  },
  {
    name: 'estadisticas_generales',
    description:
      'Regresa un resumen general del sistema: total de empresas activas/inactivas, ' +
      'top estados y sectores, total de seguimientos y su distribución por estatus. ' +
      'Úsala para preguntas generales tipo "dame un resumen" o "¿cómo va todo?".',
    input_schema: { type: 'object', properties: {} }
  },
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
  if (args.tipoEmpresa) query.tipoEmpresa = { $regex: args.tipoEmpresa, $options: 'i' };
  if (args.estado) query['ubicacion.estado'] = { $regex: `^${args.estado}$`, $options: 'i' };
  if (args.municipio) query['ubicacion.municipio'] = { $regex: `^${args.municipio}$`, $options: 'i' };
  if (args.tamanoEmpresa) query.tamanoEmpresa = args.tamanoEmpresa;
  if (args.tipoOperacion) query.tipoOperaciones = { $regex: args.tipoOperacion, $options: 'i' };
  if (args.sector) {
    query['informacionEmpresa.sectoresPertenece.lista'] = { $regex: args.sector, $options: 'i' };
  }

  const limite = clamp(args.limite, 15, 50);

  const empresas = await Company.find(query)
    .select(
      'nombreComercial razonSocial rfc tipoEmpresa tamanoEmpresa ubicacion.estado ubicacion.municipio ' +
      'informacionEmpresa.sectoresPertenece.lista tipoOperaciones activa'
    )
    .limit(limite)
    .sort({ nombreComercial: 1 })
    .lean();

  return { total: empresas.length, empresas };
}

async function obtenerDetalleEmpresa(args: any) {
  const termino = String(args.nombreORfc || '').trim();
  if (!termino) return { encontrada: false, mensaje: 'No se proporcionó un nombre o RFC.' };

  const empresa = await Company.findOne({
    $or: [
      { nombreComercial: { $regex: termino,$options: 'i' } },
      { razonSocial: { $regex: termino,$options: 'i' } },
      { rfc: { $regex: `^${termino}$`, $options: 'i' } }
    ]
  }).lean();

  if (!empresa) return { encontrada: false, mensaje: `No se encontró ninguna empresa que coincida con "${termino}".` };
  return { encontrada: true, empresa };
}

async function estadisticasEmpresas(args: any) {
  const match: any = {};
  if (args.soloActivas !== false) match.activa = true;

  const campoAAgrupar: Record<string, string> = {
    estado: '$ubicacion.estado',
    municipio: '$ubicacion.municipio',
    tamanoEmpresa: '$tamanoEmpresa',
    sector: '$informacionEmpresa.sectoresPertenece.lista',
    paisOrigen: '$informacionEmpresa.paisOrigen'
  };

  const campo = campoAAgrupar[args.agrupadoPor];
  if (!campo) return { error: 'agrupadoPor inválido' };

  const pipeline: any[] = [{ $match: match }];

  if (args.agrupadoPor === 'sector') {
    pipeline.push({ $unwind: { path: campo, preserveNullAndEmptyArrays: false } });
  }

  pipeline.push(
    { $group: { _id: campo, total: {$sum: 1 } } },
    { $sort: { total: -1 } },     {$limit: 25 }
  );

  const resultados = await Company.aggregate(pipeline);
  return {
    agrupadoPor: args.agrupadoPor,
    resultados: resultados.map((r) => ({ valor: r._id ?? 'Sin especificar', total: r.total }))
  };
}

async function buscarSeguimientos(args: any) {
  const pipeline: any[] = [];
  const match: any = {};

  if (args.estatus) match.estatus = { $regex: `^${args.estatus}$`, $options: 'i' };
  if (args.tipoSeguimiento) match.tipoSeguimiento = { $regex: args.tipoSeguimiento, $options: 'i' };
  if (typeof args.esVinculacion === 'boolean') match.esVinculacion = args.esVinculacion;

  if (args.fechaDesde || args.fechaHasta) {
    match.$expr = {$and: [] as any[] };
    if (args.fechaDesde) {
      match.$expr.$and.push({$gte: [{ $substr: ['$fechaSeguimiento', 0, 10] }, args.fechaDesde] });
    }
    if (args.fechaHasta) {
      match.$expr.$and.push({$lte: [{ $substr: ['$fechaSeguimiento', 0, 10] }, args.fechaHasta] });
    }
  }

  pipeline.push({ $match: match });
  
  // JOIN con empresa principal
  pipeline.push({
    $lookup: { from: 'companies', localField: 'empresaId', foreignField: '_id', as: 'empresaId' }
  });
  pipeline.push({ $unwind: { path: '$empresaId', preserveNullAndEmptyArrays: true } });

  // JOIN con empresas vinculadas
  pipeline.push({
    $lookup: { from: 'companies', localField: 'empresasVinculadas', foreignField: '_id', as: 'empresasVinculadasData' }
  });

  // Filtro post-join para permitir buscar en empresa principal o en sus vinculadas
  if (args.empresaNombre) {
    pipeline.push({
      $match: {$or: [
          { 'empresaId.nombreComercial': { $regex: args.empresaNombre, $options: 'i' } },
          { 'empresasVinculadasData.nombreComercial': { $regex: args.empresaNombre, $options: 'i' } }
        ]
      }
    });
  }

  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({ $limit: clamp(args.limite, 15, 50) });
  
  pipeline.push({
    $project: {
      fechaSeguimiento: 1,
      horaSeguimiento: 1,
      tipoSeguimiento: 1,
      esVinculacion: 1,
      medioAtencion: 1,
      asunto: 1,
      estatus: 1,
      'empresaId.nombreComercial': 1,
      'empresasVinculadasData.nombreComercial': 1
    }
  });

  const seguimientos = await CompanyFollowUp.aggregate(pipeline);
  return { total: seguimientos.length, seguimientos };
}

async function estadisticasGenerales() {
  const [totalActivas, totalInactivas, topEstados, topSectores, totalSeguimientos, seguimientosPorEstatus] =
    await Promise.all([
      Company.countDocuments({ activa: true }),
      Company.countDocuments({ activa: false }),
      Company.aggregate([
        { $match: { activa: true } },
        { $group: { _id: '$ubicacion.estado', total: {$sum: 1 } } },
        { $sort: { total: -1 } },         {$limit: 5 }
      ]),
      Company.aggregate([
        { $match: { activa: true } },
        { $unwind: '$informacionEmpresa.sectoresPertenece.lista' },
        { $group: { _id: '$informacionEmpresa.sectoresPertenece.lista', total: {$sum: 1 } } },
        { $sort: { total: -1 } },         {$limit: 5 }
      ]),
      CompanyFollowUp.countDocuments({}),
      CompanyFollowUp.aggregate([{ $group: { _id: '$estatus', total: {$sum: 1 } } }])
    ]);

  return {
    empresas: { activas: totalActivas, inactivas: totalInactivas },
    topEstados: topEstados.map((r) => ({ estado: r._id ?? 'Sin especificar', total: r.total })),
    topSectores: topSectores.map((r) => ({ sector: r._id ?? 'Sin especificar', total: r.total })),
    seguimientos: {
      total: totalSeguimientos,
      porEstatus: seguimientosPorEstatus.map((r) => ({ estatus: r._id ?? 'Sin especificar', total: r.total }))
    }
  };
}

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
    .select('nombre email rol activo createdAt')
    .limit(limite)
    .sort({ nombre: 1 })
    .lean();

  return { total: usuarios.length, usuarios };
}

async function buscarBitacora(args: any) {
  const pipeline: any[] = [];
  const match: any = {};

  if (args.accion) match.accion = { $regex: args.accion, $options: 'i' };
  if (args.modulo) match.modulo = { $regex: args.modulo, $options: 'i' };

  if (args.fechaDesde || args.fechaHasta) {
    match.createdAt = {};
    if (args.fechaDesde) match.createdAt.$gte = new Date(`${args.fechaDesde}T00:00:00.000Z`);
    if (args.fechaHasta) match.createdAt.$lte = new Date(`${args.fechaHasta}T23:59:59.999Z`);
  }

  pipeline.push({ $match: match });

  pipeline.push({
    $lookup: {
      from: 'users', 
      localField: 'usuarioId', 
      foreignField: '_id', 
      as: 'usuarioData'
    }
  });
  pipeline.push({ $unwind: { path: '$usuarioData', preserveNullAndEmptyArrays: true } });

  pipeline.push({
    $lookup: {
      from: 'companies',
      localField: 'empresaId',
      foreignField: '_id',
      as: 'empresaData'
    }
  });
  pipeline.push({ $unwind: { path: '$empresaData', preserveNullAndEmptyArrays: true } });

  if (args.usuarioNombre) {
    pipeline.push({
      $match: { 'usuarioData.nombre': { $regex: args.usuarioNombre, $options: 'i' } }
    });
  }

  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({ $limit: clamp(args.limite, 15, 50) });

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
    case 'buscar_usuarios': return buscarUsuarios(args || {});
    case 'buscar_bitacora': return buscarBitacora(args || {});
    default: return { error: `Herramienta desconocida: ${nombre}` };
  }
}