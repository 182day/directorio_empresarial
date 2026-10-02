// src/middlewares/validators/documentValidator.ts
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateCompanyDocument = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('El título del documento es obligatorio.')
    .isLength({ min: 3, max: 150 }).withMessage('El título debe tener entre 3 y 150 caracteres.'),

  body('tipoDocumento')
    .trim()
    .notEmpty().withMessage('El tipo de documento es obligatorio.'),

  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder los 500 caracteres.'),

  (req: Request, res: Response, next: NextFunction) => {
    // 1. Validar errores de express-validator en body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        message: 'Errores de validación en la información del documento.',
        errors: errors.array().map(err => ({
          field: err.type === 'field' ? err.path : err.type,
          message: err.msg
        }))
      });
      return;
    }

    // 2. Validar que se haya subido un archivo mediante Multer
    if (!req.file) {
      res.status(400).json({
        message: 'Debes adjuntar un archivo válido para subir.'
      });
      return;
    }

    next();
  }
];