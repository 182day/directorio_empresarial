// src/routes/aiRoutes.ts
import { Router } from 'express';
//import { chatConIA } from '../controllers/aiControllerGemini';
import { chatConIA } from '../controllers/aiControllerGroq';
import { protect, checkRole } from '../middlewares/authMiddleware';

const router = Router();

// Protegido: solo usuarios autenticados con rol admin o editor
router.post('/chat', protect, checkRole(['admin', 'editor', 'lector']), chatConIA);

export default router;