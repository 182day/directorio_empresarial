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
  getCompanyFollowUps,
  getFollowUpCompanies,
  getFollowUpUsers,
  updateCompanyFollowUp,
  deleteCompanyFollowUp
} from '../controllers/companyController';
import { protect, optionalAuth } from '../middlewares/authMiddleware';
import { validatePublicCompany } from '../middlewares/validators/companyValidator';
import { validateCompanyFollowUp } from '../middlewares/validators/followValidator';

const router = Router();

// 1. Rutas Públicas de Empresas
router.get('/', optionalAuth, getCompanies);
router.post('/public', validatePublicCompany, createPublicCompany);

// 2. Rutas de Seguimientos
router.post('/follows', protect, validateCompanyFollowUp, createCompanyFollowUp);
router.get('/follows', protect, getCompanyFollowUps);
router.get('/follows/filter-companies', protect, getFollowUpCompanies);
router.get('/follows/filter-users', protect, getFollowUpUsers);

// 💡 Rutas PUT y DELETE para seguimiento por ID del seguimiento
router.put('/follows/:id', protect, validateCompanyFollowUp, updateCompanyFollowUp);
router.delete('/follows/:id', protect, deleteCompanyFollowUp);

// Ruta paramétrica de seguimientos por ID de empresa
router.get('/follows/:companyId', protect, getCompanyFollowUps);

// 3. Rutas Paramétricas y Protegidas de Empresas
router.get('/:id', getCompanyById);
router.post('/', protect, validatePublicCompany, createCompany);
router.put('/:id', protect, validatePublicCompany, updateCompany);
router.delete('/:id', protect, deleteCompany);

export default router;