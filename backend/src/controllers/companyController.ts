// src/controllers/companyController.ts
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Company } from '../models/Company';
import { AuditLog } from '../models/AuditLog';
import { getClientIp } from '../utils/getClientIp';

// POST: Registrar una empresa desde el formulario público
export const createPublicCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      nombreComercial,
      razonSocial,
      rfc,
      tamanoEmpresa,
      anioInicio,
      sitioWeb,
      etiquetas,
      estado,
      municipio
    } = req.body;

    if (rfc) {
      const rfcExistente = await Company.findOne({ rfc: rfc.toUpperCase().trim() });
      if (rfcExistente) {
        res.status(400).json({
          message: 'El RFC ya se encuentra registrado en el sistema.'
        });
        return;
      }
    }

    let operacionesArray: string[] = [];
    if (typeof etiquetas === 'string' && etiquetas.trim() !== '') {
      operacionesArray = etiquetas.split(',').map((o) => o.trim());
    } else if (Array.isArray(etiquetas)) {
      operacionesArray = etiquetas;
    }

    const newCompany = new Company({
      nombreComercial,
      razonSocial,
      rfc: rfc?.toUpperCase().trim(),
      tamanoEmpresa: tamanoEmpresa || 'Micro',
      anioInicio: Number(anioInicio) || new Date().getFullYear(),
      sitioWeb: sitioWeb || '',
      etiquetas: operacionesArray,
      tipoSuministro: [],
      ubicacion: {
        estado: estado || '',
        municipio: municipio || '',
        direccion: '',
        colonia: '',
        codigoPostal: '',
        parqueIndustrial: ''
      },
      activa: false
    });

    const savedCompany = await newCompany.save();

    // 📝 REGISTRO EN BITÁCORA (Registro Público - Sin usuarioId directo o con un valor por defecto si aplica)
    await AuditLog.create({
      accion: 'CREAR',
      modulo: 'Empresas',
      empresaId: savedCompany._id,
      // usuarioId se omite o se asigna un usuario genérico público si tu esquema lo exige obligatorio,
      // pero como ya hicimos empresaId opcional, asegurémonos que usuarioId no rompa si es requerido en el schema.
      detalles: { origen: 'Formulario Público', estatusInicial: 'Inactiva' },
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

// GET: Obtener todas las empresas
export const getCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { busqueda, estado, municipio, tipoOperacion } = req.query;
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

    if (estado) query['ubicacion.estadoId'] = estado;
    if (municipio) query['ubicacion.municipioId'] = municipio;
    if (tipoOperacion) query.etiquetas = tipoOperacion;

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

// POST: Crear una nueva empresa (Administrador)
export const createCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      nombreComercial,
      razonSocial,
      rfc,
      tamanoEmpresa,
      anioInicio,
      sitioWeb,
      etiquetas,
      estado,
      municipio,
      activa
    } = req.body;

    if (rfc) {
      const rfcExistente = await Company.findOne({ rfc: rfc.toUpperCase().trim() });
      if (rfcExistente) {
        res.status(400).json({
          message: 'El RFC ya se encuentra registrado en el sistema.'
        });
        return;
      }
    }

    let operacionesArray: string[] = [];
    if (typeof etiquetas === 'string' && etiquetas.trim() !== '') {
      operacionesArray = etiquetas.split(',').map((o) => o.trim());
    } else if (Array.isArray(etiquetas)) {
      operacionesArray = etiquetas;
    }

    const newCompany = new Company({
      nombreComercial,
      razonSocial,
      rfc: rfc?.toUpperCase().trim(),
      tamanoEmpresa: tamanoEmpresa || 'Micro',
      anioInicio: Number(anioInicio) || new Date().getFullYear(),
      sitioWeb: sitioWeb || '',
      etiquetas: operacionesArray,
      tipoSuministro: ['Directo'],
      ubicacion: {
        estado: estado || '',
        municipio: municipio || '',
        direccion: req.body.direccion || 'Sin dirección registrada',
        colonia: req.body.colonia || 'Sin colonia',
        codigoPostal: req.body.codigoPostal || '00000',
        parqueIndustrial: req.body.parqueIndustrial || ''
      },
      activa: activa !== undefined ? activa : true
    });

    const savedCompany = await newCompany.save();

    // 📝 REGISTRO EN BITÁCORA (Panel Administrador)
    const userId = req.user?.id || req.user?._id;
    if (userId) {
      await AuditLog.create({
        accion: 'CREAR',
        modulo: 'Empresas',
        empresaId: savedCompany._id,
        usuarioId: new Types.ObjectId(userId as string),
        detalles: { origen: 'Panel de Administración' },
        ip: getClientIp(req) // 👈 IP capturada
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
    const {
      nombreComercial,
      razonSocial,
      rfc,
      tamanoEmpresa,
      anioInicio,
      sitioWeb,
      etiquetas,
      estado,
      municipio,
      activa
    } = req.body;

    if (rfc) {
      const rfcLimpio = rfc.toUpperCase().trim();
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
    }

    let operacionesArray: string[] = [];
    if (typeof etiquetas === 'string' && etiquetas.trim() !== '') {
      operacionesArray = etiquetas.split(',').map((o) => o.trim());
    } else if (Array.isArray(etiquetas)) {
      operacionesArray = etiquetas;
    }

    const updateData: any = {
      nombreComercial,
      razonSocial,
      rfc: rfc?.toUpperCase().trim(),
      tamanoEmpresa,
      anioInicio: Number(anioInicio),
      sitioWeb,
      etiquetas: operacionesArray,
      'ubicacion.estado': estado,
      'ubicacion.municipio': municipio
    };

    if (activa !== undefined) {
      updateData.activa = activa;
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

    // 📝 REGISTRO EN BITÁCORA (Actualización)
    const userId = req.user?.id || req.user?._id;
    if (userId) {
      await AuditLog.create({
        accion: 'EDITAR',
        modulo: 'Empresas',
        empresaId: new Types.ObjectId(id as string),
        usuarioId: new Types.ObjectId(userId as string),
        detalles: { camposActualizados: updateData },
        ip: getClientIp(req) // 👈 IP capturada
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

    // 📝 REGISTRO EN BITÁCORA (Eliminación)
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
        ip: getClientIp(req) // 👈 IP capturada
      });
    }

    res.json({ mensaje: 'Empresa eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar la empresa', error });
  }
};