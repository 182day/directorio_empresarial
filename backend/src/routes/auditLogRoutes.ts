// src/routes/auditLogRoutes.ts
import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { protect, checkRole } from '../middlewares/authMiddleware';

const router = Router();

// Solo el rol admin puede consultar la bitácora
router.get('/', protect, checkRole(['admin']), getAuditLogs);

export default router;