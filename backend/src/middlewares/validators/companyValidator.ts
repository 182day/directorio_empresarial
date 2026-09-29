// src/validators/companyValidator.ts
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validatePublicCompany = [
    // --- DATOS BÁSICOS OBLIGATORIOS SIEMPRE ---
    body('nombreComercial')
        .trim()
        .notEmpty().withMessage('El nombre comercial es obligatorio.')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre comercial debe tener entre 2 y 100 caracteres.'),

    body('rfc')
        .trim()
        .notEmpty().withMessage('El RFC es obligatorio.')
        .matches(/^([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2}[A\d])$/i)
        .withMessage('El formato de RFC no es válido para México.'),

    body('tipoEmpresa')
        .optional()
        .trim(),

    // --- CAMPOS OBLIGATORIOS SOLO SI TIPO DE EMPRESA ES "Empresa directorio" ---

    body('correoElectronico')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .trim()
        .notEmpty().withMessage('El correo electrónico institucional es obligatorio.')
        .isEmail().withMessage('El formato del correo electrónico no es válido.'),

    body('razonSocial')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .trim()
        .notEmpty().withMessage('La razón social es obligatoria.'),

    body('tamanoEmpresa')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .notEmpty().withMessage('El tamaño de la empresa es obligatorio.')
        .isIn(['Micro', 'Pequeña', 'Mediana', 'Grande']).withMessage('Tamaño de empresa no válido.'),

    body('anioInicio')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .notEmpty().withMessage('El año de inicio es obligatorio.')
        .isInt({ min: 1800, max: new Date().getFullYear() })
        .withMessage(`El año de inicio debe ser un número válido entre 1800 y ${new Date().getFullYear()}.`),

    body('sitioWeb')
        .optional({ checkFalsy: true })
        .trim()
        .isURL().withMessage('El formato del sitio web no es válido (ejemplo: https://miempresa.com).'),

    // --- UBICACIÓN ---
    body('ubicacion.estado')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .trim()
        .notEmpty().withMessage('El estado es obligatorio.'),

    body('ubicacion.municipio')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .trim()
        .notEmpty().withMessage('El municipio es obligatorio.'),

    body('ubicacion.direccion')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .trim()
        .notEmpty().withMessage('La dirección es obligatoria.'),

    body('ubicacion.colonia')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .trim()
        .notEmpty().withMessage('La colonia es obligatoria.'),

    body('ubicacion.codigoPostal')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .trim()
        .notEmpty().withMessage('El código postal es obligatorio.'),

    // --- OPERACIONES Y SUMINISTRO ---
    body('tipoOperaciones')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .isArray({ min: 1 }).withMessage('Debe seleccionar al menos un tipo de operación.'),

    body('tipoSuministro')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .isArray({ min: 1 }).withMessage('Debe seleccionar un tipo de suministro.'),

    // --- CONTACTO: DIRECTOR GENERAL ---
    body('contactos.directorGeneral.nombreCompleto')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .trim()
        .notEmpty().withMessage('El nombre del Director General es obligatorio.'),

    body('contactos.directorGeneral.correoElectronico')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .trim()
        .notEmpty().withMessage('El correo del Director General es obligatorio.')
        .isEmail().withMessage('El correo del Director General no es válido.'),

    // --- INFORMACIÓN DE LA EMPRESA ---
    body('informacionEmpresa.productosFabrica')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .trim()
        .notEmpty().withMessage('Los productos o servicios que fabrica son obligatorios.'),

    body('informacionEmpresa.paisOrigen')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .trim()
        .notEmpty().withMessage('El país de origen es obligatorio.'),

    body('informacionEmpresa.porcentajeInversionNacional')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .notEmpty().withMessage('El porcentaje de inversión nacional es obligatorio.')
        .isInt({ min: 0, max: 100 }).withMessage('El porcentaje de inversión nacional debe estar entre 0 y 100.'),

    body('informacionEmpresa.porcentajeInversionExtranjero')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .notEmpty().withMessage('El porcentaje de inversión extranjero es obligatorio.')
        .isInt({ min: 0, max: 100 }).withMessage('El porcentaje de inversión extranjero debe estar entre 0 y 100.'),

    body('informacionEmpresa.sectoresPertenece.lista')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .isArray({ min: 1 }).withMessage('Debe seleccionar al menos un sector al que pertenece la empresa.'),

    body('informacionEmpresa.principalSectorAtiende')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .trim()
        .notEmpty().withMessage('El principal sector al que atiende es obligatorio.'),

    body('informacionEmpresa.porcentajeExportaciones')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .notEmpty().withMessage('El porcentaje de exportaciones es obligatorio.')
        .isInt({ min: 0, max: 100 }).withMessage('El porcentaje de exportaciones debe estar entre 0 y 100.'),

    // --- RETOS Y APOYOS ---
    body('retosActuales')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .trim()
        .notEmpty().withMessage('Los retos actuales son obligatorios.'),

    body('apoyosYNecesidades.tipos')
        .if((value, { req }) => req.body.tipoEmpresa === 'Empresa directorio')
        .isArray({ min: 1 }).withMessage('Debe seleccionar al menos un tipo de apoyo o necesidad.'),

    // Middleware final que captura y responde los errores estructurados
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                message: 'Errores de validación en el formulario.',
                errors: errors.array().map(err => ({
                    field: err.type === 'field' ? err.path : err.type,
                    message: err.msg
                }))
            });
            return;
        }
        next();
    }
];