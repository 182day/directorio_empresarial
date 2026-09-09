// src/routes/companyRoutes.ts
import { Router } from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  createPublicCompany, // 👈 Agregar la función pública
  updateCompany,
  deleteCompany
} from '../controllers/companyController';
import { protect, optionalAuth } from '../middlewares/authMiddleware';
import { validatePublicCompany } from '../middlewares/validators/companyValidator';

const router = Router();

// Rutas Públicas (Vista general del directorio)
router.get('/', optionalAuth, getCompanies);
router.get('/:id', getCompanyById);
router.post('/public', validatePublicCompany, createPublicCompany);

// Rutas Protegidas (Panel de Administración)
router.post('/', protect, validatePublicCompany, createCompany);
router.put('/:id', protect, validatePublicCompany, updateCompany);
router.delete('/:id', protect, deleteCompany);

export default router;