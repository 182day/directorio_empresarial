// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { getClientIp } from '../utils/getClientIp';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  // console.log(`\n======================================================`);
  // console.log(`🛡️  PETICIÓN RECIBIDA EN PROTECT: [${req.method}] ${req.originalUrl}`);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

      // console.log('🔍 Payload Decodificado del JWT:', decoded);

      const userId = decoded.id || decoded._id;
      const currentUser = await User.findById(userId);

      // console.log('👤 Usuario encontrado en BD:', currentUser ? `${currentUser.nombre} (${currentUser.email})` : 'NO ENCONTRADO EN BD');
      // console.log('❓ Valor de currentUser.activo:', currentUser?.activo, `(Tipo de dato: ${typeof currentUser?.activo})`);

      if (!currentUser) {
        // console.log('❌ RECHAZADO: El usuario fue eliminado o no existe en la BD (401)');
        res.status(401).json({ message: 'El usuario no existe o fue eliminado.', mensaje: 'El usuario no existe o fue eliminado.' });
        return;
      }

      if (!currentUser.activo) {
        // console.log('⛔ RECHAZADO: Usuario inactivo. Se detiene petición y envía status 403');
        res.status(403).json({ message: 'Tu cuenta ha sido desactivada.', mensaje: 'Tu cuenta ha sido desactivada.' });
        return;
      }

      // console.log('✅ ACCESO CONCEDIDO: El usuario está activo. Pasando al controlador...');
      // console.log(`======================================================\n`);

      req.user = decoded;
      return next();
    } catch (error) {
      // console.log('💥 ERROR EN JWT O EN LA BÚSQUEDA:', error);
      res.status(401).json({ message: 'No autorizado, token no válido', mensaje: 'No autorizado, token no válido' });
      return;
    }
  }

  if (!token) {
    // console.log('⚠️ RECHAZADO: No viene token Bearer en los headers (401)');
    res.status(401).json({ message: 'No autorizado, no se proporcionó token', mensaje: 'No autorizado, no se proporcionó token' });
    return;
  }
};

// Middleware opcional que no bloquea si no hay token
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
      req.user = decoded;
    } catch (error) {
      req.user = undefined;
    }
  }
  next();
};

// 👈 NUEVO: Middleware para validar Roles y Registrar Intentos No Autorizados (403)
export const checkRole = (rolesPermitidos: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ mensaje: 'No autorizado, usuario no autenticado' });
        return;
      }

      if (!rolesPermitidos.includes(req.user.rol)) {
        const clientIp = getClientIp(req);

        // Registrar intento de acceso sin permisos en Bitácora
        await AuditLog.create({
          accion: 'ACCESO_DENEGADO',
          modulo: req.baseUrl ? req.baseUrl.replace('/api/', '').toUpperCase() : 'Seguridad',
          usuarioId: req.user.id || req.user._id,
          detalles: {
            motivo: 'El rol del usuario no tiene permisos para este módulo',
            rolUsuario: req.user.rol,
            rolesRequeridos: rolesPermitidos,
            rutaIntentada: req.originalUrl,
            metodoHttp: req.method
          },
          ip: clientIp
        });

        res.status(403).json({ 
          mensaje: 'Acceso denegado: No tienes los permisos necesarios para realizar esta acción.' 
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Error en middleware checkRole:', error);
      res.status(500).json({ mensaje: 'Error al verificar permisos del usuario' });
    }
  };
};