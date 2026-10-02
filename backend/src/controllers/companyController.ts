// src/controllers/companyController.ts
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Company } from '../models/Company';
import { AuditLog } from '../models/AuditLog';
import { CompanyFollowUp } from '../models/CompanyFollowUp';
import { getClientIp } from '../utils/getClientIp';
import { processEtiquetas } from '../utils/processTags';
import { compressImage } from '../utils/imageOptimizer';
import path from 'path';
import fs from 'fs';

// POST: Registrar una empresa desde el formulario público
export const createPublicCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rfc, tipoEmpresa } = req.body;

    // Validación de RFC duplicado
    if (rfc) {
      const rfcExistente = await Company.findOne({ rfc: rfc.toUpperCase().trim() });
      if (rfcExistente) {
        res.status(400).json({
          message: 'El RFC ya se encuentra registrado en el sistema.'
        });
        return;
      }
    }

    const payload = {
      ...req.body,
      tipoEmpresa: tipoEmpresa || 'Empresa directorio',
      correoElectronico: req.body.correoElectronico?.trim().toLowerCase() || '',
      rfc: rfc?.toUpperCase().trim(),
      etiquetas: [],
      activa: false // Inactiva por defecto para revisión administrativa
    };

    const newCompany = new Company(payload);
    const savedCompany = await newCompany.save();

    // 📝 Bitácora de auditoría
    await AuditLog.create({
      accion: 'CREAR',
      modulo: 'Empresas',
      empresaId: savedCompany._id,
      detalles: { origen: 'Formulario Público', camposRegistrados: payload },
      ip: getClientIp(req)
    });

    res.status(201).json({
      message: 'Solicitud enviada con éxito. Tu empresa será revisada por un administrador.',
      data: savedCompany
    });
  } catch (error: any) {
    console.error('Error al crear empresa pública:', error);

    if (error?.code === 11000 && error?.keyPattern?.rfc) {
      res.status(400).json({
        message: 'El RFC ya se encuentra registrado en el sistema.'
      });
      return;
    }

    if (error?.name === 'ValidationError') {
      res.status(400).json({
        message: 'Error de validación en los datos enviados.',
        errors: error.errors,
        detalles: error.message
      });
      return;
    }

    res.status(500).json({
      message: 'Error interno del servidor al procesar el registro.',
      error: error?.message || error
    });
  }
};

// GET: Obtener empresas con filtros opcionales
export const getCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { busqueda, estado, municipio, tipoOperacion, sector, tipoEmpresa } = req.query;
    const query: any = {};

    const userRole = req.user?.rol;
    const canSeeAll = userRole === 'admin' || userRole === 'editor';

    if (!canSeeAll) {
      query.activa = true;
    }

    if (busqueda) {
      query.$or = [
        { nombreComercial: { $regex: busqueda, $options: 'i' } },
        { razonSocial: { $regex: busqueda, $options: 'i' } },
        { rfc: { $regex: busqueda, $options: 'i' } }
      ];
    }

    if (tipoEmpresa) query.tipoEmpresa = tipoEmpresa;
    if (estado) query['ubicacion.estado'] = estado;
    if (municipio) query['ubicacion.municipio'] = municipio;
    if (tipoOperacion) query.tipoOperaciones = tipoOperacion;
    if (sector) query['informacionEmpresa.sectoresPertenece.lista'] = sector;

    const companies = await Company.find(query).sort({ nombreComercial: 1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener las empresas', error });
  }
};

// GET: Obtener una empresa por ID
export const getCompanyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      res.status(404).json({ mensaje: 'Empresa no encontrada' });
      return;
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener la empresa', error });
  }
};

// POST: Crear una empresa desde el panel de administración
export const createCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rfc, activa, etiquetas, tipoEmpresa } = req.body;

    if (rfc) {
      const rfcExistente = await Company.findOne({ rfc: rfc.toUpperCase().trim() });
      if (rfcExistente) {
        res.status(400).json({
          message: 'El RFC ya se encuentra registrado en el sistema.'
        });
        return;
      }
    }

    const payload = {
      ...req.body,
      tipoEmpresa: tipoEmpresa || 'Empresa directorio',
      rfc: rfc?.toUpperCase().trim(),
      etiquetas: processEtiquetas(etiquetas),
      activa: activa !== undefined ? activa : true
    };

    const newCompany = new Company(payload);
    const savedCompany = await newCompany.save();

    // 📝 Bitácora
    const userId = req.user?.id || req.user?._id;
    if (userId) {
      await AuditLog.create({
        accion: 'CREAR',
        modulo: 'Empresas',
        empresaId: savedCompany._id,
        usuarioId: new Types.ObjectId(userId as string),
        detalles: { origen: 'Panel de Administración', camposRegistrados: payload },
        ip: getClientIp(req)
      });
    }

    res.status(201).json(savedCompany);
  } catch (error: any) {
    console.error('Error al crear empresa:', error);

    if (error?.code === 11000 && error?.keyPattern?.rfc) {
      res.status(400).json({
        message: 'El RFC ya se encuentra registrado en el sistema.'
      });
      return;
    }

    if (error?.name === 'ValidationError') {
      res.status(400).json({
        message: 'Error de validación en los datos enviados.',
        detalles: error.message
      });
      return;
    }

    res.status(500).json({
      message: 'Error interno del servidor al crear la empresa.',
      error: error?.message || error
    });
  }
};

// PUT: Actualizar una empresa existente
export const updateCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.rfc) {
      const rfcLimpio = updateData.rfc.toUpperCase().trim();
      const empresaConMismoRfc = await Company.findOne({
        rfc: rfcLimpio,
        _id: { $ne: id }
      });

      if (empresaConMismoRfc) {
        res.status(400).json({
          message: 'El RFC ingresado ya pertenece a otra empresa registrada.'
        });
        return;
      }
      updateData.rfc = rfcLimpio;
    }

    if (updateData.etiquetas) {
      updateData.etiquetas = processEtiquetas(updateData.etiquetas);
    }

    const companyUpdated = await Company.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    if (!companyUpdated) {
      res.status(404).json({ message: 'Empresa no encontrada.' });
      return;
    }

    // 📝 Bitácora
    const userId = req.user?.id || req.user?._id;
    if (userId) {
      await AuditLog.create({
        accion: 'EDITAR',
        modulo: 'Empresas',
        empresaId: new Types.ObjectId(id as string),
        usuarioId: new Types.ObjectId(userId as string),
        detalles: { camposActualizados: updateData },
        ip: getClientIp(req)
      });
    }

    res.status(200).json(companyUpdated);
  } catch (error: any) {
    console.error('Error al actualizar empresa:', error);

    if (error?.code === 11000) {
      res.status(400).json({
        message: 'El RFC ya se encuentra registrado en el sistema.'
      });
      return;
    }

    res.status(500).json({
      message: error.message || 'Error interno del servidor al actualizar.'
    });
  }
};

// DELETE: Eliminar una empresa
export const deleteCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deletedCompany = await Company.findByIdAndDelete(req.params.id);
    if (!deletedCompany) {
      res.status(404).json({ mensaje: 'Empresa no encontrada' });
      return;
    }

    // 📝 Bitácora
    const userId = req.user?.id || req.user?._id;
    if (userId) {
      await AuditLog.create({
        accion: 'ELIMINAR',
        modulo: 'Empresas',
        empresaId: new Types.ObjectId(req.params.id as string),
        usuarioId: new Types.ObjectId(userId as string),
        detalles: {
          nombreEmpresaEliminada: deletedCompany.nombreComercial,
          rfc: deletedCompany.rfc
        },
        ip: getClientIp(req)
      });
    }

    res.json({ mensaje: 'Empresa eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar la empresa', error });
  }
};

// POST: Registrar seguimiento
export const createCompanyFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      empresaId,
      fechaSeguimiento,
      horaSeguimiento,
      tipoSeguimiento,
      esVinculacion,
      medioAtencion,
      asunto,
      descripcion,
      atencionSeguimiento,
      estatus,
      empresasVinculadas
    } = req.body;

    if (!empresaId || !asunto || !descripcion) {
      res.status(400).json({ message: 'Los campos empresa, asunto y descripción son obligatorios.' });
      return;
    }

    if (!Types.ObjectId.isValid(empresaId)) {
      res.status(400).json({ message: 'El ID de la empresa no tiene un formato válido.' });
      return;
    }

    const userId = req.user?.id || req.user?._id;
    const parsedDate = fechaSeguimiento ? new Date(fechaSeguimiento) : new Date();

    const vinculadasArray = Array.isArray(empresasVinculadas)
      ? empresasVinculadas
        .filter((id: string) => Types.ObjectId.isValid(id))
        .map((id: string) => new Types.ObjectId(id))
      : [];

    const followUp = new CompanyFollowUp({
      empresaId: new Types.ObjectId(empresaId as string),
      usuarioId: userId && Types.ObjectId.isValid(userId as string) ? new Types.ObjectId(userId as string) : undefined,
      fechaSeguimiento: parsedDate,
      horaSeguimiento,
      tipoSeguimiento,
      esVinculacion: Boolean(esVinculacion),
      medioAtencion,
      asunto,
      descripcion,
      atencionSeguimiento,
      estatus,
      empresasVinculadas: esVinculacion ? vinculadasArray : []
    });

    const savedFollowUp = await followUp.save();

    if (userId) {
      await AuditLog.create({
        accion: 'CREAR',
        modulo: 'SeguimientoEmpresas',
        empresaId: new Types.ObjectId(empresaId as string),
        usuarioId: new Types.ObjectId(userId as string),
        detalles: { asunto, tipoSeguimiento, esVinculacion },
        ip: getClientIp(req)
      });
    }

    res.status(201).json(savedFollowUp);
  } catch (error: any) {
    console.error('Error al guardar seguimiento:', error);
    res.status(500).json({ message: 'Error al registrar el seguimiento.', error: error?.message || error });
  }
};

// PUT: Actualizar seguimiento
export const updateCompanyFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      empresaId,
      fechaSeguimiento,
      horaSeguimiento,
      tipoSeguimiento,
      esVinculacion,
      medioAtencion,
      asunto,
      descripcion,
      atencionSeguimiento,
      estatus,
      empresasVinculadas
    } = req.body;

    if (!id || !Types.ObjectId.isValid(id as string)) {
      res.status(400).json({ message: 'El ID del seguimiento no es válido.' });
      return;
    }

    const parsedDate = fechaSeguimiento ? new Date(fechaSeguimiento) : new Date();

    const vinculadasArray = Array.isArray(empresasVinculadas)
      ? empresasVinculadas
        .filter((vId: string) => Types.ObjectId.isValid(vId))
        .map((vId: string) => new Types.ObjectId(vId))
      : [];

    const updatePayload: any = {
      fechaSeguimiento: parsedDate,
      horaSeguimiento,
      tipoSeguimiento,
      esVinculacion: Boolean(esVinculacion),
      medioAtencion,
      asunto,
      descripcion,
      atencionSeguimiento,
      estatus,
      empresasVinculadas: esVinculacion ? vinculadasArray : []
    };

    if (empresaId && Types.ObjectId.isValid(empresaId as string)) {
      updatePayload.empresaId = new Types.ObjectId(empresaId as string);
    }

    const updatedFollowUp = await CompanyFollowUp.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedFollowUp) {
      res.status(404).json({ message: 'Seguimiento no encontrado.' });
      return;
    }

    const userId = req.user?.id || req.user?._id;
    if (userId) {
      await AuditLog.create({
        accion: 'EDITAR',
        modulo: 'SeguimientoEmpresas',
        empresaId: updatedFollowUp.empresaId || undefined,
        usuarioId: new Types.ObjectId(userId as string),
        detalles: { seguimientoId: id, asunto },
        ip: getClientIp(req)
      });
    }

    res.status(200).json(updatedFollowUp);
  } catch (error: any) {
    console.error('Error al actualizar el seguimiento:', error);
    res.status(500).json({ message: 'Error al actualizar el seguimiento.', error: error?.message || error });
  }
};

// GET: Obtener seguimientos con populate de empresas vinculadas
export const getCompanyFollowUps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const {
      search,
      tipo,
      medio,
      estatus,
      empresa,
      usuario,
      esVinculacion,
      fechaDesde,
      fechaHasta
    } = req.query;

    const matchStage: any = {};

    if (companyId) {
      matchStage.empresaId = new Types.ObjectId(companyId as string);
    }

    if (tipo) {
      const tiposArray = Array.isArray(tipo) ? tipo : (tipo as string).split(',');
      matchStage.tipoSeguimiento = { $in: tiposArray };
    }

    if (medio) {
      const mediosArray = Array.isArray(medio) ? medio : (medio as string).split(',');
      matchStage.medioAtencion = { $in: mediosArray };
    }

    if (estatus) {
      const estatusArray = Array.isArray(estatus) ? estatus : (estatus as string).split(',');
      matchStage.estatus = { $in: estatusArray };
    }

    if (esVinculacion !== undefined && esVinculacion !== '') {
      const vincArray = Array.isArray(esVinculacion)
        ? esVinculacion
        : (esVinculacion as string).split(',');

      const booleanConditions: boolean[] = [];

      vincArray.forEach((val) => {
        const normalized = String(val).trim().toLowerCase();
        if (normalized === 'sí' || normalized === 'si' || normalized === 'true') {
          booleanConditions.push(true);
        } else if (normalized === 'no' || normalized === 'false') {
          booleanConditions.push(false);
        }
      });

      if (booleanConditions.length > 0) {
        matchStage.esVinculacion = { $in: booleanConditions };
      }
    }

    if (fechaDesde || fechaHasta) {
      matchStage.$expr = matchStage.$expr || { $and: [] };

      if (fechaDesde) {
        matchStage.$expr.$and.push({
          $gte: [{ $substr: ["$fechaSeguimiento", 0, 10] }, fechaDesde]
        });
      }
      if (fechaHasta) {
        matchStage.$expr.$and.push({
          $lte: [{ $substr: ["$fechaSeguimiento", 0, 10] }, fechaHasta]
        });
      }
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'companies',
          localField: 'empresaId',
          foreignField: '_id',
          as: 'empresaId'
        }
      },
      { $unwind: { path: '$empresaId', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'usuarioId',
          foreignField: '_id',
          as: 'usuarioId'
        }
      },
      { $unwind: { path: '$usuarioId', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'companies',
          localField: 'empresasVinculadas',
          foreignField: '_id',
          as: 'empresasVinculadas'
        }
      }
    ];

    const postLookupMatch: any = {};

    if (empresa) {
      const empresasArray = Array.isArray(empresa) ? empresa : (empresa as string).split(',');
      postLookupMatch['empresaId.nombreComercial'] = { $in: empresasArray };
    }

    if (usuario) {
      const usuariosArray = Array.isArray(usuario) ? usuario : (usuario as string).split(',');
      postLookupMatch['usuarioId.nombre'] = { $in: usuariosArray };
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      postLookupMatch.$or = [
        { descripcion: regex },
        { asunto: regex },
        { 'empresaId.nombreComercial': regex },
        { 'usuarioId.nombre': regex },
        { 'empresasVinculadas.nombreComercial': regex }
      ];
    }

    if (Object.keys(postLookupMatch).length > 0) {
      pipeline.push({ $match: postLookupMatch });
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    const followUps = await CompanyFollowUp.aggregate(pipeline);

    res.json(followUps);
  } catch (error: any) {
    console.error('Error al obtener seguimientos filtrados:', error);
    res.status(500).json({ message: 'Error al obtener los seguimientos', error: error?.message || error });
  }
};

// DELETE: Eliminar un seguimiento de empresa
export const deleteCompanyFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id as string)) {
      res.status(400).json({ message: 'El ID del seguimiento no es válido.' });
      return;
    }

    const deletedFollowUp = await CompanyFollowUp.findByIdAndDelete(id);

    if (!deletedFollowUp) {
      res.status(404).json({ message: 'Seguimiento no encontrado.' });
      return;
    }

    // 📝 Auditoría
    const userId = req.user?.id || req.user?._id;
    if (userId) {
      await AuditLog.create({
        accion: 'ELIMINAR',
        modulo: 'SeguimientoEmpresas',
        empresaId: deletedFollowUp.empresaId || undefined,
        usuarioId: new Types.ObjectId(userId as string),
        detalles: { seguimientoId: id, asunto: deletedFollowUp.asunto },
        ip: getClientIp(req)
      });
    }

    res.status(200).json({ message: 'Seguimiento eliminado con éxito.' });
  } catch (error: any) {
    console.error('Error al eliminar el seguimiento:', error);
    res.status(500).json({ message: 'Error al eliminar el seguimiento.', error: error?.message || error });
  }
};

// GET: Obtener solo las empresas agrupadas que poseen seguimientos
export const getFollowUpCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companies = await CompanyFollowUp.aggregate([
      {
        $lookup: {
          from: 'companies',
          localField: 'empresaId',
          foreignField: '_id',
          as: 'empresa'
        }
      },
      { $unwind: '$empresa' },
      {
        $group: {
          _id: '$empresa._id',
          nombreComercial: { $first: '$empresa.nombreComercial' },
          rfc: { $first: '$empresa.rfc' }
        }
      },
      { $sort: { nombreComercial: 1 } }
    ]);

    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener empresas de seguimientos', error });
  }
};

// GET: Obtener solo los usuarios agrupados que han registrado seguimientos
export const getFollowUpUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await CompanyFollowUp.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'usuarioId',
          foreignField: '_id',
          as: 'usuario'
        }
      },
      { $unwind: '$usuario' },
      {
        $group: {
          _id: '$usuario._id',
          nombre: { $first: '$usuario.nombre' },
          email: { $first: '$usuario.email' }
        }
      },
      { $sort: { nombre: 1 } }
    ]);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios de seguimientos', error });
  }
};

// POST: Adjuntar documento a una empresa
export const uploadCompanyDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { titulo, tipoDocumento, descripcion } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: 'No se ha adjuntado ningún archivo.' });
      return;
    }

    // 1. Buscar la empresa para obtener el RFC y el número de documentos actuales
    const company = await Company.findById(id);
    if (!company) {
      res.status(404).json({ message: 'Empresa no encontrada.' });
      return;
    }

    // 📸 OPTIMIZACIÓN: Si es Fotografía (o Logotipo), comprimimos la imagen con Sharp antes de renombrarla
    if (tipoDocumento === 'Fotografía' || tipoDocumento === 'Logotipo') {
      await compressImage(file.path, 80, 1920); // Calidad al 80%, ancho máx 1920px
    }

    // 2. Generar el nombre estandarizado: RFC_TipoDocumento_Contador
    const rfcLimpio = (company.rfc || 'SIN_RFC').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const tipoLimpio = (tipoDocumento || 'DOC').toUpperCase().replace(/\s+/g, '_');
    const contador = (company.documentos?.length || 0) + 1;
    const extension = path.extname(file.originalname);

    const nuevoNombreArchivo = `${rfcLimpio}_${tipoLimpio}_${contador}${extension}`;

    // 3. Renombrar físicamente el archivo guardado por Multer
    const antiguaRuta = file.path;
    const nuevaRuta = path.join(file.destination, nuevoNombreArchivo);
    fs.renameSync(antiguaRuta, nuevaRuta);

    // Obtener el tamaño final del archivo físico (especialmente importante si fue comprimido)
    const statsFinales = fs.statSync(nuevaRuta);

    // 4. Estructurar el documento (guardando solo el nombre del archivo)
    const docData = {
      titulo,
      tipoDocumento,
      descripcion,
      nombreArchivo: nuevoNombreArchivo,
      mimeType: file.mimetype,
      tamano: statsFinales.size, // 👈 Se guarda el tamaño real en bytes del archivo comprimido
      fechaSubida: new Date()
    };

    // 5. Actualizar la empresa
    company.documentos = company.documentos || [];
    company.documentos.push(docData as any);
    await company.save();

    // 6. Registro en la bitácora de auditoría
    const userId = req.user?.id || req.user?._id;
    if (userId) {
      await AuditLog.create({
        accion: 'EDITAR',
        modulo: 'Empresas',
        empresaId: new Types.ObjectId(id as string),
        usuarioId: new Types.ObjectId(userId as string),
        detalles: { accion: 'Adjuntar Documento', documento: docData },
        ip: getClientIp(req)
      });
    }

    res.status(200).json({
      message: 'Documento adjuntado exitosamente.',
      documento: docData,
      company
    });
  } catch (error: any) {
    console.error('Error al adjuntar documento:', error);
    res.status(500).json({
      message: 'Error interno del servidor al guardar el documento.',
      error: error?.message || error
    });
  }
};

// GET: Servir / Visualizar documento protegido por nombre de archivo
export const getCompanyDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const filename = req.params.filename as string; // 👈 Aseguramos que sea string

    if (!filename || typeof filename !== 'string') {
      res.status(400).json({ message: 'El nombre del archivo es requerido y debe ser válido.' });
      return;
    }

    // Construir la ruta absoluta
    const filePath = path.resolve(process.cwd(), 'src', 'assets', 'empresas', filename);

    // Verificar si el archivo existe físicamente
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'El documento solicitado no existe o fue removido.' });
      return;
    }

    // Configurar Content-Type si es PDF
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    }

    // Enviar archivo
    res.sendFile(filePath);
  } catch (error: any) {
    console.error('Error al obtener el documento:', error);
    res.status(500).json({
      message: 'Error interno del servidor al obtener el documento.',
      error: error?.message || error
    });
  }
};

// DELETE: Eliminar documento de una empresa y borrar el archivo físico
export const deleteCompanyDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, docId } = req.params;

    if (!Types.ObjectId.isValid(id as string) || !Types.ObjectId.isValid(docId as string)) {
      res.status(400).json({ message: 'Los identificadores de la empresa o del documento no son válidos.' });
      return;
    }

    // 1. Buscar la empresa para obtener la referencia del documento
    const company = await Company.findById(id);
    if (!company) {
      res.status(404).json({ message: 'Empresa no encontrada.' });
      return;
    }

    // 2. Localizar el documento en el subdocumento
    const docAEliminar = company.documentos?.find(
      (doc: any) => doc._id.toString() === docId
    );

    if (!docAEliminar) {
      res.status(404).json({ message: 'El documento no existe en la empresa.' });
      return;
    }

    // 3. Eliminar el archivo físico de la carpeta src/assets/empresas si existe
    if (docAEliminar.nombreArchivo) {
      const filePath = path.resolve(process.cwd(), 'src', 'assets', 'empresas', docAEliminar.nombreArchivo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 4. Remover el documento del arreglo subdocumental y guardar la empresa
    company.documentos = company.documentos?.filter(
      (doc: any) => doc._id.toString() !== docId
    );
    await company.save();

    // 5. Registro en la bitácora de auditoría
    const userId = req.user?.id || req.user?._id;
    if (userId) {
      await AuditLog.create({
        accion: 'EDITAR',
        modulo: 'Empresas',
        empresaId: new Types.ObjectId(id as string),
        usuarioId: new Types.ObjectId(userId as string),
        detalles: { accion: 'Eliminar Documento', documentoEliminado: docAEliminar },
        ip: getClientIp(req)
      });
    }

    res.status(200).json({
      message: 'Documento eliminado con éxito.',
      company
    });
  } catch (error: any) {
    console.error('Error al eliminar el documento:', error);
    res.status(500).json({
      message: 'Error interno del servidor al eliminar el documento.',
      error: error?.message || error
    });
  }
};

// POST: Importar XLSX a la BD
export const importCompaniesExcel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Debe adjuntar un archivo de Excel (.xlsx).' });
      return;
    }

    const filePath = req.file.path;
    const { processExcelFile } = await import('../scripts/importExcel');

    // Procesar archivo Excel
    const resultado = await processExcelFile(filePath);

    // Eliminar archivo temporal tras el procesamiento
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 📝 Registrar Bitácora de Auditoría
    const userId = req.user?.id || req.user?._id;
    if (userId) {
      await AuditLog.create({
        accion: 'CREAR',
        modulo: 'Empresas',
        usuarioId: new Types.ObjectId(userId as string),
        detalles: {
          origen: 'Importación Masiva Excel',
          archivoNombre: req.file.originalname,
          registrosProcesados: resultado.total,
          registrosInsertados: resultado.guardados,
          registrosOmitidos: resultado.omitidos
        },
        ip: getClientIp(req)
      });
    }

    res.status(200).json({
      message: 'Importado con éxito',
      registrosInsertados: resultado.guardados,
      registrosOmitidos: resultado.omitidos,
      totalProcesados: resultado.total
    });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error durante la importación masiva:', error);
    res.status(500).json({
      message: 'Error interno al procesar el archivo Excel.',
      error: error.message || error
    });
  }
};