// src/controllers/companyController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Company } from '../models/Company';

// POST: Registrar una empresa desde el formulario público (Inactiva por defecto)
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

    // 1. Verificación previa de RFC duplicado
    if (rfc) {
      const rfcExistente = await Company.findOne({ rfc: rfc.toUpperCase().trim() });
      if (rfcExistente) {
        res.status(400).json({
          message: 'El RFC ya se encuentra registrado en el sistema.'
        });
        return;
      }
    }

    // 2. Normalizar etiquetas (si viene como string separado por comas, convertirlo a Array)
    let operacionesArray: string[] = [];
    if (typeof etiquetas === 'string' && etiquetas.trim() !== '') {
      operacionesArray = etiquetas.split(',').map((o) => o.trim());
    } else if (Array.isArray(etiquetas)) {
      operacionesArray = etiquetas;
    }

    // 3. Mapear datos a la estructura exacta del esquema de Mongoose
    const newCompany = new Company({
      nombreComercial,
      razonSocial,
      rfc: rfc?.toUpperCase().trim(),
      tamanoEmpresa: tamanoEmpresa || 'Micro',
      anioInicio: Number(anioInicio) || new Date().getFullYear(),
      sitioWeb: sitioWeb || '',
      etiquetas: operacionesArray,
      tipoSuministro: [], // Campo opcional o por defecto
      ubicacion: {
        estado: estado || '',
        municipio: municipio || '',
        direccion: '',
        colonia: '',
        codigoPostal: '',
        parqueIndustrial: ''
      },
      activa: false // Permanece inactiva hasta ser aprobada por un Administrador
    });

    const savedCompany = await newCompany.save();

    res.status(201).json({
      message: 'Solicitud enviada con éxito. Tu empresa será revisada por un administrador.',
      data: savedCompany
    });
  } catch (error: any) {
    console.error('Error al crear empresa pública:', error); // Permite ver el log en consola de Express

    // Captura de RFC duplicado a nivel Mongoose
    if (error?.code === 11000 && error?.keyPattern?.rfc) {
      res.status(400).json({
        message: 'El RFC ya se encuentra registrado en el sistema.'
      });
      return;
    }

    // Error de validación de esquema en Mongoose
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
// GET: Obtener todas las empresas (con soporte para búsqueda y filtros)
export const getCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { busqueda, estado, municipio, tipoOperacion } = req.query;
    //const query: any = { activa: true };
    const query: any = {};

    // 👈 Verificar si el usuario tiene rol 'admin' o 'editor'
    const userRole = req.user?.rol; // Ajusta 'rol' según como guardes la propiedad en tu JWT
    const canSeeAll = userRole === 'admin' || userRole === 'editor';

    // Si NO es admin ni editor (lector o sin loguear), filtrar solo por empresas activas
    if (!canSeeAll) {
      query.activa = true;
    }

    // Filtro de búsqueda general por nombre o RFC
    if (busqueda) {
      query.$or = [
        { nombreComercial: { $regex: busqueda, $options: 'i' } },
        { razonSocial: { $regex: busqueda, $options: 'i' } },
        { rfc: { $regex: busqueda, $options: 'i' } }
      ];
    }

    // Filtros específicos
    if (estado) query['ubicacion.estadoId'] = estado;
    if (municipio) query['ubicacion.municipioId'] = municipio;
    if (tipoOperacion) query.etiquetas = tipoOperacion;

    const companies = await Company.find(query).sort({ nombreComercial: 1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener las empresas', error });
  }
};

// GET: Obtener una empresa por su ID
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

// POST: Crear una nueva empresa (Ruta protegida)
export const createCompany = async (req: Request, res: Response): Promise<void> => {
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

    // 1. Verificación previa de RFC duplicado
    if (rfc) {
      const rfcExistente = await Company.findOne({ rfc: rfc.toUpperCase().trim() });
      if (rfcExistente) {
        res.status(400).json({
          message: 'El RFC ya se encuentra registrado en el sistema.'
        });
        return;
      }
    }

    // 2. Normalizar etiquetas
    let operacionesArray: string[] = [];
    if (typeof etiquetas === 'string' && etiquetas.trim() !== '') {
      operacionesArray = etiquetas.split(',').map((o) => o.trim());
    } else if (Array.isArray(etiquetas)) {
      operacionesArray = etiquetas;
    }

    // 3. Mapear datos estructurando la ubicación correctamente
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
      activa: activa !== undefined ? activa : true // Por defecto activa si la crea un Admin
    });

    const savedCompany = await newCompany.save();
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

// PUT: Actualizar una empresa existente (Ruta protegida)
export const updateCompany = async (req: Request, res: Response): Promise<void> => {
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

    // 1. Validar si el RFC pertenece a otra empresa
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

    // 2. Normalizar etiquetas
    let operacionesArray: string[] = [];
    if (typeof etiquetas === 'string' && etiquetas.trim() !== '') {
      operacionesArray = etiquetas.split(',').map((o) => o.trim());
    } else if (Array.isArray(etiquetas)) {
      operacionesArray = etiquetas;
    }

    // 3. Estructurar el objeto de actualización de forma plana/anidada para Mongoose
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

// DELETE: Eliminar una empresa (Ruta protegida)
export const deleteCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedCompany = await Company.findByIdAndDelete(req.params.id);
    if (!deletedCompany) {
      res.status(404).json({ mensaje: 'Empresa no encontrada' });
      return;
    }
    res.json({ mensaje: 'Empresa eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar la empresa', error });
  }
};