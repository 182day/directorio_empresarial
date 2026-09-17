// src/controllers/companyController.ts
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Company } from '../models/Company';
import { AuditLog } from '../models/AuditLog';
import { CompanyFollowUp } from '../models/CompanyFollowUp';
import { getClientIp } from '../utils/getClientIp';

// Helper para procesar el string de etiquetas enviado por el frontend
const processEtiquetas = (etiquetas: any): string[] => {
  if (Array.isArray(etiquetas)) return etiquetas;
  if (typeof etiquetas === 'string' && etiquetas.trim() !== '') {
    return etiquetas.split(',').map((t) => t.trim()).filter((t) => t !== '');
  }
  return [];
};

// POST: Registrar una empresa desde el formulario público
export const createPublicCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rfc, etiquetas } = req.body;

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
      correoElectronico: req.body.correoElectronico?.trim().toLowerCase(),
      rfc: rfc?.toUpperCase().trim(),
      //etiquetas: processEtiquetas(etiquetas),
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
      detalles: { origen: 'Formulario Público', estatusInicial: 'Inactiva' },
      ip: getClientIp(req)
    });

    res.status(201).json({
      message: 'Solicitud enviada con éxito. Tu empresa será revisada por un administrador.',
      data: savedCompany
    });
  } catch (error: any) {
    console.error('Error al crear empresa pública:', error);
    console.error('Error detallado al crear empresa pública:', JSON.stringify(error, null, 2));

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
    const { busqueda, estado, municipio, tipoOperacion, sector } = req.query;
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
    const { rfc, activa, etiquetas } = req.body;

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
        detalles: { origen: 'Panel de Administración' },
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

// POST: Registrar seguimiento de empresa
export const createCompanyFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { empresaId, fechaSeguimiento, horaSeguimiento, tipoSeguimiento, medioAtencion, asunto, descripcion, atencionSeguimiento, estatus } = req.body;

    if (!empresaId || !asunto || !descripcion) {
      res.status(400).json({ message: 'Los campos empresaId, asunto y descripción son obligatorios.' });
      return;
    }

    const userId = req.user?.id || req.user?._id;

    const followUp = new CompanyFollowUp({
      empresaId,
      usuarioId: userId ? new Types.ObjectId(userId as string) : undefined,
      fechaSeguimiento,
      horaSeguimiento,
      tipoSeguimiento,
      medioAtencion,
      asunto,
      descripcion,
      atencionSeguimiento,
      estatus
    });

    const savedFollowUp = await followUp.save();

    // 📝 Auditoría
    if (userId) {
      await AuditLog.create({
        accion: 'CREAR',
        modulo: 'SeguimientoEmpresas',
        empresaId: new Types.ObjectId(empresaId as string),
        usuarioId: new Types.ObjectId(userId as string),
        detalles: { asunto, tipoSeguimiento },
        ip: getClientIp(req)
      });
    }

    res.status(201).json(savedFollowUp);
  } catch (error: any) {
    console.error('Error al guardar seguimiento:', error);
    res.status(500).json({ message: 'Error al registrar el seguimiento.', error: error?.message || error });
  }
};

// GET: Obtener seguimientos (de una empresa específica o todos) con Populate (Inner Join)
export const getCompanyFollowUps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const query = companyId ? { empresaId: companyId } : {};

    const followUps = await CompanyFollowUp.find(query)
      .populate('empresaId', 'nombreComercial rfc razonSocial') // 👈 JOIN con Empresa
      .populate('usuarioId', 'nombre email')                    // 👈 JOIN con Usuario
      .sort({ createdAt: -1 });

    res.json(followUps);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los seguimientos', error });
  }
};