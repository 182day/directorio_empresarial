import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// 1. Reglas de validación para el registro público
export const validatePublicCompany = [
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

    body('estado')
        .trim()
        .notEmpty().withMessage('El estado es obligatorio.'),

    body('municipio')
        .trim()
        .notEmpty().withMessage('El municipio es obligatorio.'),

    // Middleware final que captura y responde los errores
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