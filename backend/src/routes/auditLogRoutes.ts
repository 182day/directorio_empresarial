// src/routes/auditLogRoutes.ts
import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { protect, optionalAuth } from '../middlewares/authMiddleware';
const router = Router();

// Endpoint protegido: Solo administradores pueden consultar la bitácora
router.get('/', [protect, optionalAuth], getAuditLogs);

export default router;