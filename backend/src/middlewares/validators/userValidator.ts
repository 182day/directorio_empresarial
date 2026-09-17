// src/validators/userValidator.ts
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateUser = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre completo es obligatorio.')
        .isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres.'),

    body('email')
        .trim()
        .notEmpty().withMessage('El correo electrónico es obligatorio.')
        .isEmail().withMessage('El formato del correo electrónico no es válido.'),

    // La contraseña es obligatoria en POST (creación), pero opcional en PUT (edición)
    body('password')
        .optional({ checkFalsy: true })
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),

    body('rol')
        .optional()
        .isIn(['admin', 'editor', 'lector']).withMessage('El rol seleccionado no es válido.'),

    body('activo')
        .optional()
        .isBoolean().withMessage('El estado de la cuenta debe ser un valor booleano.'),

    // Middleware final para capturar errores de validación
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                message: errors.array()[0].msg, // Devuelve el primer mensaje claro para toast.error
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