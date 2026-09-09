// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
      req.user = decoded;
      return next();
    } catch (error) {
      res.status(401).json({ mensaje: 'No autorizado, token no válido' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ mensaje: 'No autorizado, no se proporcionó token' });
    return;
  }
};

// 👈 NUEVO: Middleware opcional que no bloquea la petición si no hay token
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
      req.user = decoded;
    } catch (error) {
      // Si el token es inválido, simplemente ignoramos req.user y dejamos continuar
      req.user = undefined;
    }
  }
  next();
};