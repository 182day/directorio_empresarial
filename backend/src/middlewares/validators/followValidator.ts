// src/validators/followValidator.ts
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

export const validateCompanyFollowUp = [
  body('empresaId')
    .notEmpty()
    .withMessage('El ID de la empresa es obligatorio.')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('El ID de la empresa no tiene un formato válido de MongoDB.'),

  body('fechaSeguimiento')
    .notEmpty()
    .withMessage('La fecha de seguimiento es obligatoria.')
    .isISO8601()
    .withMessage('La fecha debe tener un formato válido (YYYY-MM-DD).'),

  body('horaSeguimiento')
    .notEmpty()
    .withMessage('La hora de seguimiento es obligatoria.')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('La hora debe estar en formato HH:MM (24 horas).'),

  body('tipoSeguimiento')
    .notEmpty()
    .withMessage('El tipo de seguimiento es obligatorio.')
    .isIn(['Vinculación', 'Apoyo', 'Evento', 'Asesoría', 'Capacitación', 'Otro'])
    .withMessage('El tipo de seguimiento no es válido.'),

  body('medioAtencion')
    .notEmpty()
    .withMessage('El medio de atención es obligatorio.')
    .isIn(['Reunión', 'Llamada telefónica', 'Correo', 'Visita', 'Otro'])
    .withMessage('El medio de atención no es válido.'),

  body('asunto')
    .trim()
    .notEmpty()
    .withMessage('El asunto es obligatorio.')
    .isLength({ max: 150 })
    .withMessage('El asunto no puede exceder los 150 caracteres.'),

  body('descripcion')
    .trim()
    .notEmpty()
    .withMessage('La descripción es obligatoria.'),

  body('atencionSeguimiento')
    .optional()
    .trim(),

  body('estatus')
    .optional()
    .isIn(['En Proceso', 'Concluido', 'Cancelado'])
    .withMessage('El estatus no es válido.'),

  // Middleware para verificar si existen errores de validación
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        message: 'Error de validación en los datos del seguimiento.',
        errors: errors.array()
      });
      return;
    }
    next();
  }
];