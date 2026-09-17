// src/routes/companyRoutes.ts
import { Router } from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  createPublicCompany,
  updateCompany,
  deleteCompany,
  createCompanyFollowUp,
  getCompanyFollowUps
} from '../controllers/companyController';
import { protect, optionalAuth } from '../middlewares/authMiddleware';
import { validatePublicCompany } from '../middlewares/validators/companyValidator';
import { validateCompanyFollowUp } from '../middlewares/validators/followValidator';

const router = Router();

// 1. Rutas Públicas de Empresas
router.get('/', optionalAuth, getCompanies);
router.post('/public', validatePublicCompany, createPublicCompany);

// 2. Rutas de Seguimientos (Van ANTES de /:id para evitar colisiones)
router.post('/follows', protect, validateCompanyFollowUp, createCompanyFollowUp);
router.get('/follows', protect, getCompanyFollowUps);
router.get('/follows/:companyId', protect, getCompanyFollowUps);

// 3. Rutas Paramétricas y Protegidas de Empresas
router.get('/:id', getCompanyById);
router.post('/', protect, validatePublicCompany, createCompany);
router.put('/:id', protect, validatePublicCompany, updateCompany);
router.delete('/:id', protect, deleteCompany);

export default router;