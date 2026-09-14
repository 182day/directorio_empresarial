import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// 1. Reglas de validación para el registro público alineadas con el frontend
export const validatePublicCompany = [
    body('correoElectronico')
        .trim()
        .notEmpty().withMessage('El correo electrónico institucional es obligatorio.')
        .isEmail().withMessage('El formato del correo electrónico no es válido.'),

    body('nombreComercial')
        .trim()
        .notEmpty().withMessage('El nombre comercial es obligatorio.')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre comercial debe tener entre 2 y 100 caracteres.'),

    body('razonSocial')
        .trim()
        .notEmpty().withMessage('La razón social es obligatoria.'),

    body('rfc')
        .trim()
        .notEmpty().withMessage('El RFC es obligatorio.')
        .matches(/^([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2}[A\d])$/i)
        .withMessage('El formato de RFC no es válido para México.'),

    body('tamanoEmpresa')
        .notEmpty().withMessage('El tamaño de la empresa es obligatorio.')
        .isIn(['Micro', 'Pequeña', 'Mediana', 'Grande']).withMessage('Tamaño de empresa no válido.'),

    body('anioInicio')
        .notEmpty().withMessage('El año de inicio es obligatorio.')
        .isInt({ min: 1800, max: new Date().getFullYear() })
        .withMessage(`El año de inicio debe ser un número válido entre 1800 y ${new Date().getFullYear()}.`),

    body('sitioWeb')
        .optional({ checkFalsy: true })
        .trim()
        .isURL().withMessage('El formato del sitio web no es válido (ejemplo: https://miempresa.com).'),

    // --- UBICACIÓN (Anidada) ---
    body('ubicacion.estado')
        .trim()
        .notEmpty().withMessage('El estado es obligatorio.'),

    body('ubicacion.municipio')
        .trim()
        .notEmpty().withMessage('El municipio es obligatorio.'),

    body('ubicacion.direccion')
        .trim()
        .notEmpty().withMessage('La dirección es obligatoria.'),

    body('ubicacion.colonia')
        .trim()
        .notEmpty().withMessage('La colonia es obligatoria.'),

    body('ubicacion.codigoPostal')
        .trim()
        .notEmpty().withMessage('El código postal es obligatorio.'),

    // --- OPERACIONES Y SUMINISTRO ---
    body('tipoOperaciones')
        .isArray({ min: 1 }).withMessage('Debe seleccionar al menos un tipo de operación.'),

    body('tipoSuministro')
        .isArray({ min: 1 }).withMessage('Debe seleccionar un tipo de suministro.'),

    // --- CONTACTO: DIRECTOR GENERAL ---
    body('contactos.directorGeneral.nombreCompleto')
        .trim()
        .notEmpty().withMessage('El nombre del Director General es obligatorio.'),

    body('contactos.directorGeneral.correoElectronico')
        .trim()
        .notEmpty().withMessage('El correo del Director General es obligatorio.')
        .isEmail().withMessage('El correo del Director General no es válido.'),

    // --- INFORMACIÓN DE LA EMPRESA ---
    body('informacionEmpresa.productosFabrica')
        .trim()
        .notEmpty().withMessage('Los productos o servicios que fabrica son obligatorios.'),

    body('informacionEmpresa.paisOrigen')
        .trim()
        .notEmpty().withMessage('El país de origen es obligatorio.'),

    body('informacionEmpresa.porcentajeInversionNacional')
        .notEmpty().withMessage('El porcentaje de inversión nacional es obligatorio.')
        .isInt({ min: 0, max: 100 }).withMessage('El porcentaje de inversión nacional debe estar entre 0 y 100.'),

    body('informacionEmpresa.porcentajeInversionExtranjero')
        .notEmpty().withMessage('El porcentaje de inversión extranjero es obligatorio.')
        .isInt({ min: 0, max: 100 }).withMessage('El porcentaje de inversión extranjero debe estar entre 0 y 100.'),

    body('informacionEmpresa.sectoresPertenece.lista')
        .isArray({ min: 1 }).withMessage('Debe seleccionar al menos un sector al que pertenece la empresa.'),

    body('informacionEmpresa.principalSectorAtiende')
        .trim()
        .notEmpty().withMessage('El principal sector al que atiende es obligatorio.'),

    body('informacionEmpresa.porcentajeExportaciones')
        .notEmpty().withMessage('El porcentaje de exportaciones es obligatorio.')
        .isInt({ min: 0, max: 100 }).withMessage('El porcentaje de exportaciones debe estar entre 0 y 100.'),

    // --- RETOS Y APOYOS ---
    body('retosActuales')
        .trim()
        .notEmpty().withMessage('Los retos actuales son obligatorios.'),

    body('apoyosYNecesidades.tipos')
        .isArray({ min: 1 }).withMessage('Debe seleccionar al menos un tipo de apoyo o necesidad.'),

    // Middleware final que captura y responde los errores estructurados para el front
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