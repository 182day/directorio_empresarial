// src/routes/userRoutes.ts
import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas requieren estar autenticado
router.use(protect);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;