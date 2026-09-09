// src/routes/authRoutes.ts
import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { protect, AuthRequest } from '../middlewares/authMiddleware';
import { User } from '../models/User'; // 👈 Importas el modelo

const router = Router();

router.post('/register', register);
router.post('/login', login);

// Ruta protegida para verificar token y consultar usuario completo
router.get('/verify', protect, async (req: AuthRequest, res) => {
  try {
    // req.user contiene { id, rol } extraído del JWT
    const user = await User.findById(req.user.id).select('nombre email rol activo');

    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (!user.activo) {
      return res.status(403).json({ mensaje: 'Cuenta desactivada' });
    }

    res.json({
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al verificar token', error });
  }
});

export default router;