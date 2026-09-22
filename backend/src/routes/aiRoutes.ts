// src/routes/aiRoutes.ts
import { Router } from 'express';
import { chatConIA } from '../controllers/aiController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Protegido: solo usuarios autenticados pueden usar el asistente de IA.
// Si quieres restringirlo solo a admin/editor, valida req.user.rol dentro del controller.
router.post('/chat', protect, chatConIA);

export default router;