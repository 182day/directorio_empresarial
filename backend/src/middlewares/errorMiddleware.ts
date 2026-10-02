// src/middlewares/errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'El archivo supera el tamaño máximo permitido de 15MB.'
      });
    }
    return res.status(400).json({
      message: `Error al cargar el archivo: ${err.message}`
    });
  }

  if (err && err.message) {
    return res.status(400).json({
      message: err.message
    });
  }

  console.error('Error no controlado:', err);
  res.status(500).json({
    message: 'Error interno del servidor.'
  });
};