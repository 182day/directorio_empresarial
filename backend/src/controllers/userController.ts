// src/controllers/userController.ts
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { getClientIp } from '../utils/getClientIp'; // 👈 Importar la utilidad de IP

// Interfaz para solicitudes autenticadas (si no la tienes importada desde tus middlewares)
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
    const userId = req.user?.id || req.user?._id;
    if (userId) {
      await AuditLog.create({
        accion: 'CREAR',
        modulo: 'Usuarios', // 👈 Módulo correspondiente
        usuarioId: new Types.ObjectId(userId as string),
        detalles: { 
          usuarioCreado: nombre, 
          emailCreado: email, 
          rol: rol || 'lector' 
        },
        ip: getClientIp(req) // 👈 IP capturada
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
    if (rol) user.rol = rol;
    if (activo !== undefined) user.activo = activo;

    // Si se envía una nueva contraseña, el pre('save') del modelo la encriptará
    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();

    // 📝 REGISTRO EN BITÁCORA (Actualizar Usuario)
    const adminId = req.user?.id || req.user?._id;
    if (adminId) {
      await AuditLog.create({
        accion: 'EDITAR',
        modulo: 'Usuarios', // 👈 Módulo correspondiente
        usuarioId: new Types.ObjectId(adminId as string),
        detalles: { 
          usuarioActualizadoId: id,
          nombreModificado: nombre,
          emailModificado: email,
          rolModificado: rol
        },
        ip: getClientIp(req) // 👈 IP capturada
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

    const userDeleted = await User.findByIdAndDelete(id);
    if (!userDeleted) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // 📝 REGISTRO EN BITÁCORA (Eliminar Usuario)
    const adminId = req.user?.id || req.user?._id;
    if (adminId) {
      await AuditLog.create({
        accion: 'ELIMINAR',
        modulo: 'Usuarios', // 👈 Módulo correspondiente
        usuarioId: new Types.ObjectId(adminId as string),
        detalles: { 
          nombreUsuarioEliminado: userDeleted.nombre,
          emailEliminado: userDeleted.email 
        },
        ip: getClientIp(req) // 👈 IP capturada
      });
    }

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar el usuario' });
  }
};