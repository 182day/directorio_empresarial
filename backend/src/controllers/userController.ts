// src/controllers/userController.ts
import { Request, Response } from 'express';
import { User } from '../models/User';

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
export const createUser = async (req: Request, res: Response): Promise<void> => {
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

    // Retornamos el usuario creado sin exponer el hash de la contraseña
    const userCreated = await User.findById(newUser._id).select('-password');
    res.status(201).json(userCreated);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el usuario' });
  }
};

// Actualizar un usuario existente
export const updateUser = async (req: Request, res: Response): Promise<void> => {
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

    const updatedUser = await User.findById(id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
};

// Eliminar un usuario
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const userDeleted = await User.findByIdAndDelete(id);
    if (!userDeleted) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el usuario' });
  }
};