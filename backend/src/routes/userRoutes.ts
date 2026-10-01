// src/routes/userRoutes.ts
import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { protect, checkRole } from '../middlewares/authMiddleware';
import { validateUser } from '../middlewares/validators/userValidator';

const router = Router();

// Todas las rutas requieren estar autenticado
router.use(protect);

// GET /api/usuarios -> Todos (admin, editor, lector)
router.get('/', checkRole(['admin', 'editor', 'lector']), getUsers);

// POST /api/usuarios -> Solo admin
router.post('/', checkRole(['admin']), validateUser, createUser);

// PUT /api/usuarios/:id -> Todos (admin edita a cualquiera; editor/lector validan ID en el controller)
router.put('/:id', checkRole(['admin', 'editor', 'lector']), validateUser, updateUser);

// DELETE /api/usuarios/:id -> Solo admin
router.delete('/:id', checkRole(['admin']), deleteUser);

export default router;