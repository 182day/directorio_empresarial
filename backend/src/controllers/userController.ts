// src/controllers/userController.ts
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { getClientIp } from '../utils/getClientIp';

// Interfaz para solicitudes autenticadas
interface AuthRequest extends Request {
  user?: {
    id?: string;
    _id?: string;
    rol?: string;
  };
}

// Obtener todos los usuarios (con búsqueda por nombre o email)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { busqueda } = req.query;
    let query: any = {};

    if (busqueda) {
      query = {
        $or: [
          { nombre: { $regex: busqueda, $options: 'i' } },
          { email: { $regex: busqueda, $options: 'i' } }
        ]
      };
    }

    // Excluimos la contraseña en las búsquedas por seguridad
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
};

// Crear un nuevo usuario
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, email, password, rol, activo } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'El correo electrónico ya está registrado' });
      return;
    }

    const newUser = new User({
      nombre,
      email,
      password,
      rol,
      activo: activo !== undefined ? activo : true
    });

    await newUser.save();

    // 📝 REGISTRO EN BITÁCORA (Crear Usuario)
    const userId = req.user?._id || req.user?.id;
    if (userId) {
      await AuditLog.create({
        accion: 'CREAR',
        modulo: 'Usuarios',
        usuarioId: new Types.ObjectId(userId as string),
        detalles: { 
          usuarioCreado: nombre, 
          emailCreado: email, 
          rol: rol || 'lector' 
        },
        ip: getClientIp(req)
      });
    }

    // Retornamos el usuario creado sin exponer el hash de la contraseña
    const userCreated = await User.findById(newUser._id).select('-password');
    res.status(201).json(userCreated);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear el usuario' });
  }
};

// Actualizar un usuario existente
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol, activo } = req.body;

    // Validar validez del ObjectId enviado en los parámetros
    if (!id || !Types.ObjectId.isValid(id as string)) {
      res.status(400).json({ message: 'El ID de usuario proporcionado no es válido' });
      return;
    }

    const currentUserId = req.user?._id || req.user?.id;
    const currentUserRole = req.user?.rol;

    // 🛑 REGLA DE SEGURIDAD / PROPIEDAD:
    // Si no es 'admin', solo se le permite editar su PROPIO ID.
    if (currentUserRole !== 'admin' && currentUserId !== id) {
      if (currentUserId) {
        await AuditLog.create({
          accion: 'ACCESO_DENEGADO',
          modulo: 'Usuarios',
          usuarioId: new Types.ObjectId(currentUserId as string),
          detalles: {
            motivo: 'El usuario intentó modificar el perfil de otro usuario sin ser Admin',
            usuarioObjetivoId: id,
            rolUsuario: currentUserRole
          },
          ip: getClientIp(req)
        });
      }

      res.status(403).json({
        message: 'Acceso denegado: Solo puedes modificar tu propio perfil.'
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Validar si se está cambiando el correo por uno que ya pertenezca a otro usuario
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        res.status(400).json({ message: 'El correo electrónico ya está en uso por otro usuario' });
        return;
      }
      user.email = email;
    }

    if (nombre) user.nombre = nombre;
    
    // Solo un administrador puede cambiar roles o desactivar cuentas
    if (currentUserRole === 'admin') {
      if (rol) user.rol = rol;
      if (activo !== undefined) user.activo = activo;
    }

    // Si se envía una nueva contraseña, el pre('save') del modelo la encriptará
    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();

    // 📝 REGISTRO EN BITÁCORA (Actualizar Usuario)
    if (currentUserId) {
      await AuditLog.create({
        accion: 'EDITAR',
        modulo: 'Usuarios',
        usuarioId: new Types.ObjectId(currentUserId as string),
        detalles: { 
          usuarioActualizadoId: id,
          nombreModificado: nombre,
          emailModificado: email,
          rolModificado: rol
        },
        ip: getClientIp(req)
      });
    }

    const updatedUser = await User.findById(id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
};

// Eliminar un usuario
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?._id || req.user?.id;

    // 1. Validar formato de ObjectId
    if (!id || !Types.ObjectId.isValid(id as string)) {
      res.status(400).json({ message: 'El ID de usuario proporcionado no es válido' });
      return;
    }

    // 🛑 2. REGLA DE SEGURIDAD: Un administrador no puede auto-eliminarse
    if (adminId && adminId.toString() === id.toString()) {
      await AuditLog.create({
        accion: 'ACCESO_DENEGADO',
        modulo: 'Usuarios',
        usuarioId: new Types.ObjectId(adminId as string),
        detalles: {
          motivo: 'El administrador intentó eliminar su propia cuenta de usuario',
          usuarioObjetivoId: id
        },
        ip: getClientIp(req)
      });

      res.status(400).json({ 
        message: 'No puedes eliminar tu propia cuenta de usuario administrador.' 
      });
      return;
    }

    // 3. Proceder a eliminar
    const userDeleted = await User.findByIdAndDelete(id);
    if (!userDeleted) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // 📝 REGISTRO EN BITÁCORA (Eliminar Usuario)
    if (adminId) {
      await AuditLog.create({
        accion: 'ELIMINAR',
        modulo: 'Usuarios',
        usuarioId: new Types.ObjectId(adminId as string),
        detalles: { 
          nombreUsuarioEliminado: userDeleted.nombre,
          emailEliminado: userDeleted.email 
        },
        ip: getClientIp(req)
      });
    }

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar el usuario' });
  }
};