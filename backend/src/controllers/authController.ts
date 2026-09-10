// src/controllers/authController.ts
import { Request, Response } from 'express';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { getClientIp } from '../utils/getClientIp';
import jwt from 'jsonwebtoken';

const generateToken = (id: string, rol: string) => {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET || 'secretkey', {
    expiresIn: '8h'
  });
};

// Autoregistro Público desde el Login (Requiere activación posterior por correo)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ mensaje: 'El correo electrónico ya está registrado' });
      return;
    }

    // Se crea inactivo por defecto y siempre con el rol base ('lector')
    const user = await User.create({
      nombre,
      email,
      password,
      rol: 'lector',
      activo: false // 👈 Requiere confirmar email para pasar a true
    });

    // TODO: Enviar correo de activación aquí mediante nodemailer / sendgrid
    // const activationToken = generateActivationToken(user._id);
    // sendActivationEmail(user.email, activationToken);

    res.status(201).json({
      mensaje: 'Registro exitoso. Te hemos enviado un correo para activar tu cuenta.',
      user: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor al registrar usuario', error });
  }
};

// Login de usuarios
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ mensaje: 'Credenciales inválidas' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ mensaje: 'Credenciales inválidas' });
      return;
    }

    if (!user.activo) {
      res.status(403).json({ message: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
      return;
    }

    // Dentro de tu función login:
    const clientIp = getClientIp(req);

    // 👇 2. Registrar el evento en la bitácora
    await AuditLog.create({
      accion: 'INICIO DE SESIÓN',
      modulo: 'Auth',
      usuarioId: user._id,
      detalles: { mensaje: `El usuario ${user.nombre} inició sesión exitosamente.` },
      ip: clientIp
    });

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      user: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol },
      token: generateToken(user._id.toString(), user.rol)
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor al iniciar sesión', error });
  }
};